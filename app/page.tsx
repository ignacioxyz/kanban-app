'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userStore } from "@/store/userStore";
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

export default function HomeForm() {
  const router = useRouter();
  const { setUser } = userStore();
  const [formData, setFormData] = useState({
    roomId: '',
    roomKey: '',
    name: '',
    email: 'guest@example.com'
  });
  const [isLoading, setIsLoading] = useState(false);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    try {
      setIsLoading(true);

      if (!formData.roomId || !formData.roomKey || !formData.name) {
        toast.error("All fields are required");
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
          roomId: formData.roomId,
          roomKey: formData.roomKey,
        }),
      });

      if (!response.ok) {
        const responseJson = await response.json();
        if (responseJson && responseJson.message) {
          throw new Error(responseJson.message);
        }
        throw new Error("Authentication failed");
      }

      setUser(formData.name, formData.email, formData.roomId, formData.roomKey);
      router.push(`/room/${formData.roomId}`);

    } catch (error) {
      console.error("error", error);
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoomId = () => {
    // Generate 6 random bytes and convert to hex string
    const randomId = crypto.getRandomValues(new Uint8Array(6))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    setFormData(prev => ({
      ...prev,
      roomId: randomId
    }));
  };

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-white text-base">
      <Image
        src="/team-work.svg"
        width={500}
        height={500}
        alt="Picture of the author"
      />
      <h2 className="text-black font-bold">Please connect to the room to continue</h2>
      <p className="text-[#898989]">Enter your details to continue</p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-4 mt-8 w-[300px]">
        <Input 
          type="text" 
          name="name"
          placeholder="Enter your name" 
          value={formData.name}
          onChange={handleInputChange}
        />
        <div className="flex gap-2 w-full">
          <Input 
            type="text" 
            name="roomId"
            placeholder="Enter room id" 
            value={formData.roomId}
            onChange={handleInputChange}
          />
          <Button 
            type="button"
            variant="outline"
            onClick={generateRoomId}
          >
            Generate
          </Button>
        </div>
        <Input 
          type="password" 
          name="roomKey"
          placeholder="Enter room key" 
          value={formData.roomKey}
          onChange={handleInputChange}
        />
        <Button 
          type="submit"
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Continue'}
        </Button>
      </form>
    </main>
  );
}