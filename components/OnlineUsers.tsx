"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOthers, useSelf } from "@liveblocks/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

export default function OnlineUsers() {
  const others = useOthers();
  const currentUser = useSelf();

  const filteredOthers = others.filter(
    (user) => user.connectionId !== currentUser?.connectionId
  );

  const allUsers = currentUser
    ? [currentUser, ...filteredOthers]
    : filteredOthers;

  const visibleUsers = filteredOthers.slice(0, 3);
  const remainingUsers = allUsers.slice(3);

  const getUserInfo = (
    user: NonNullable<typeof currentUser>
  ) => ({
    name: user.info.name,
    avatar: user.info?.avatar,
  });

  return (
    <nav className="bg-transparent w-full mx-auto">
      <div className="container max-w-screen-2xl py-[22px] px-[40px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar
              key={"currentUser"}
              className="w-[42px] h-[42px] border-2 border-background"
            >
              <AvatarImage src={currentUser?.info.avatar} alt={"name"} />
              <AvatarFallback>{currentUser?.info.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-3 text-[15px] leading-[18px] font-[560] text-black">
              <span>{currentUser?.info.name}</span>
              <span className="text-[#888a90] font-[460]">{currentUser?.info.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {visibleUsers.map((user) => {
                const { name, avatar } = getUserInfo(user);
                return (
                  <TooltipProvider key={user.connectionId}>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Avatar className="w-8 h-8 border-2 border-background cursor-pointer">
                          <AvatarImage src={avatar} alt={name} />
                          <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent className="mt-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg shadow">
                        <p className="text-sm font-medium text-white">{name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            {remainingUsers.length > 0 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2">
                    <ChevronRight className="h-4 w-4 mr-2" />
                    {remainingUsers.length} more
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Online Users</SheetTitle>
                    <SheetDescription>
                      There are currently {allUsers.length} users online.
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                    <div className="space-y-4">
                      {allUsers.map((user) => {
                        const { name, avatar } = getUserInfo(user);
                        return (
                          <div
                            key={user.connectionId || "currentUser"}
                            className="flex items-center space-x-4"
                          >
                            <Avatar>
                              <AvatarImage src={avatar} alt={name} />
                              <AvatarFallback>
                                {name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{name}</span>
                            {user === currentUser && (
                              <span className="text-sm text-muted-foreground">
                                (You)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
