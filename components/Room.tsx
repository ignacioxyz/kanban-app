"use client";
import { ChangeEvent, ReactNode, useState, useEffect } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { userStore } from "@/store/userStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { initialStorage } from "@/lib/utils";

const AuthDialog = ({
  formData,
  onInputChange,
  onSubmit,
  error,
}: {
  formData: { name: string; email: string; roomId: string; roomKey: string };
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  error?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.name && formData.email && formData.roomKey && !isLoading) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    await onSubmit();
    setIsLoading(false);
  };

  return (
    <Dialog open={true}>
      <DialogContent onKeyDown={handleKeyPress}>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Please enter your details to access the room:
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p>Error: {error}</p>
        )}
        <div className="space-y-4">
          <Input
            placeholder="Name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            required
          />
          <Input
            placeholder="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onInputChange}
            required
          />
          <Input
            placeholder="Room Key"
            name="roomKey"
            value={formData.roomKey}
            onChange={onInputChange}
            required
          />
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.name || !formData.email || !formData.roomKey || isLoading}
          >
            {isLoading ? (
              <>
                Joining...
              </>
            ) : (
              'Join Room'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LoadingComponent = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div 
        className={`transform transition-all duration-1000 ${
          isReady ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <Image
          src="/hands.svg"
          width={500}
          height={500}
          alt="Loading animation"
          className="animate-spin-slow"
        />
      </div>
    </div>
  );
};

export function Room({
  room,
  children,
}: {
  room: string;
  children: ReactNode;
}) {
  const { board } = initialStorage();
  const { name, email, roomKey, setUser } = userStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: name || "",
    email: email || "",
    roomId: room,
    roomKey: roomKey || "",
  });

  useEffect(() => {
    if (name && email && roomKey) {
      setIsAuthenticated(true);
    }
  }, [name, email, roomKey]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleAuth = async () => {
    try {
      if (!formData.name || !formData.email || !formData.roomKey) {
        setAuthError("All fields are required");
        return;
      }

      const response = await fetch("/api/liveblocks-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          roomId: room,
          roomKey: formData.roomKey,
        }),
      });

      if (!response.ok) {
        const responseJson = await response.json()
        console.log('responseJson', responseJson)
        if (responseJson && responseJson.message) {
          throw new Error(responseJson.message);
        }

        throw new Error("Authentication failed");
      }

      setUser(formData.name, formData.email, room, formData.roomKey);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.log("error", error)
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthDialog
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleAuth}
        error={authError || undefined}
      />
    );
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (roomId) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            roomId,
            roomKey,
          }),
        });
        
        if (!response.ok) {
          setIsAuthenticated(false);
          setAuthError("Session expired. Please authenticate again.");
          throw new Error("Authentication failed");
        }
        
        return response.json();
      }}
    >
      <RoomProvider
        id={room}
        initialPresence={{ cursor: null, viewingTaskId: null, draggingTask: null}}
        initialStorage={{ board }}
      >
        <ClientSideSuspense fallback={<LoadingComponent />}>
          {() => (
            <div className="transition-opacity opacity-100">
              {children}
            </div>
          )}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export default Room;