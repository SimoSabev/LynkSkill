"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { 
    MessageSquare, 
    Send, 
    ArrowLeft, 
    Loader2, 
    Sparkles,
    RefreshCw,
    CheckCheck,
    Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isToday, isYesterday } from "date-fns"
import { useTranslation } from "@/lib/i18n"

interface Conversation {
    id: string
    applicationId: string
    updatedAt: string
    application: {
        internship: {
            id: string
            title: string
        }
    }
    company?: {
        id: string
        name: string
        logo: string | null
    }
    student?: {
        id: string
        email: string
        profile?: { name: string } | null
    }
    messages: Array<{
        id: string
        content: string
        createdAt: string
        senderType: "STUDENT" | "COMPANY"
    }>
    _count: {
        messages: number
    }
}

interface Message {
    id: string
    conversationId: string
    senderId: string
    senderType: "STUDENT" | "COMPANY"
    content: string
    read: boolean
    createdAt: string
    sender: {
        id: string
        email: string
        profile?: { name: string } | null
    }
}

interface MessagesTabContentProps {
    userType: "Student" | "Company"
}

export function MessagesTabContent({ userType }: MessagesTabContentProps) {
    const { t } = useTranslation()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/messages")
            if (res.ok) {
                const data = await res.json()
                setConversations(data)
            }
        } catch (error) {
            console.error("Error fetching conversations:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        setIsLoadingMessages(true)
        try {
            const res = await fetch(`/api/messages/${conversationId}`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
                setTimeout(scrollToBottom, 100)
            }
        } catch (error) {
            console.error("Error fetching messages:", error)
        } finally {
            setIsLoadingMessages(false)
        }
    }, [scrollToBottom])

    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id)
            inputRef.current?.focus()
        }
    }, [selectedConversation, fetchMessages])

    // Poll for new messages every 10 seconds
    useEffect(() => {
        if (!selectedConversation) return
        
        const interval = setInterval(() => {
            fetchMessages(selectedConversation.id)
        }, 10000)
        
        return () => clearInterval(interval)
    }, [selectedConversation, fetchMessages])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchConversations()
        if (selectedConversation) {
            await fetchMessages(selectedConversation.id)
        }
        setRefreshing(false)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation || isSending) return

        setIsSending(true)
        try {
            const res = await fetch(`/api/messages/${selectedConversation.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage })
            })

            if (res.ok) {
                const message = await res.json()
                setMessages(prev => [...prev, message])
                setNewMessage("")
                setTimeout(scrollToBottom, 100)
            }
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setIsSending(false)
        }
    }

    const formatMessageDate = (dateString: string) => {
        const date = new Date(dateString)
        if (isToday(date)) return format(date, "h:mm a")
        if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`
        return format(date, "MMM d, h:mm a")
    }

    const getOtherPartyName = (conv: Conversation) => {
        if (userType === "Student") {
            return conv.company?.name || "Company"
        }
        return conv.student?.profile?.name || conv.student?.email || "Student"
    }

    const getOtherPartyInitial = (conv: Conversation) => {
        const name = getOtherPartyName(conv)
        return name.charAt(0).toUpperCase()
    }

    const mySenderType = userType === "Student" ? "STUDENT" : "COMPANY"

    return (
        <section className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 backdrop-blur-sm shadow-xl md:shadow-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/5 border border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm shadow-lg">
                                <MessageSquare className="h-5 w-5 md:h-7 md:w-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                                {t('messages.title')}
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base lg:text-lg font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400" />
                            {t('messages.messageHint')}
                        </p>
                    </div>

                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing || isLoading}
                        className="rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-bold transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg bg-transparent"
                    >
                        <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${refreshing ? "animate-spin" : ""} mr-2`} />
                        {refreshing ? t('common.loading') : t('common.refresh')}
                    </Button>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
                {/* Conversations List */}
                <div className={cn(
                    "lg:col-span-1 rounded-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden",
                    selectedConversation && "hidden lg:block"
                )}>
                    <div className="p-4 border-b border-border/50 bg-muted/30">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {t('messages.conversations')}
                            {conversations.length > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                    {conversations.length}
                                </Badge>
                            )}
                        </h3>
                    </div>

                    <ScrollArea className="h-[500px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                                <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground text-sm">{t('messages.noConversationsYet')}</p>
                                <p className="text-muted-foreground/70 text-xs mt-1">
                                    {t('messages.noMessagesDescription')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {conversations.map((conv) => (
                                    <motion.button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={cn(
                                            "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                                            selectedConversation?.id === conv.id && "bg-muted/70"
                                        )}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-border/50">
                                                {userType === "Student" && conv.company?.logo && (
                                                    <AvatarImage src={conv.company.logo} />
                                                )}
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                                    {getOtherPartyInitial(conv)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-foreground truncate">
                                                        {getOtherPartyName(conv)}
                                                    </p>
                                                    {conv._count.messages > 0 && (
                                                        <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-indigo-500 text-white">
                                                            {conv._count.messages}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {conv.application.internship.title}
                                                </p>
                                                {conv.messages[0] && (
                                                    <p className="text-xs text-muted-foreground/70 truncate mt-1">
                                                        {conv.messages[0].content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Messages Panel */}
                <div className={cn(
                    "lg:col-span-2 rounded-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col",
                    !selectedConversation && "hidden lg:flex"
                )}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden"
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <Avatar className="h-10 w-10 border-2 border-border/50">
                                    {userType === "Student" && selectedConversation.company?.logo && (
                                        <AvatarImage src={selectedConversation.company.logo} />
                                    )}
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                        {getOtherPartyInitial(selectedConversation)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {getOtherPartyName(selectedConversation)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedConversation.application.internship.title}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-center">
                                        <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
                                        <p className="text-muted-foreground text-sm">No messages yet</p>
                                        <p className="text-muted-foreground/70 text-xs mt-1">
                                            Send the first message!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg) => {
                                            const isMe = msg.senderType === mySenderType
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={cn(
                                                        "flex",
                                                        isMe ? "justify-end" : "justify-start"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                                                        isMe 
                                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md"
                                                            : "bg-muted border border-border/50 text-foreground rounded-bl-md"
                                                    )}>
                                                        <p className="text-sm whitespace-pre-wrap break-words">
                                                            {msg.content}
                                                        </p>
                                                        <div className={cn(
                                                            "flex items-center gap-1 mt-1 text-[10px]",
                                                            isMe ? "text-white/70 justify-end" : "text-muted-foreground"
                                                        )}>
                                                            <span>{formatMessageDate(msg.createdAt)}</span>
                                                            {isMe && (
                                                                msg.read 
                                                                    ? <CheckCheck className="h-3 w-3" />
                                                                    : <Clock className="h-3 w-3" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-muted/30">
                                <div className="flex gap-2">
                                    <Input
                                        ref={inputRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 rounded-xl border-2 border-border/50 focus:border-indigo-500"
                                        disabled={isSending}
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="rounded-xl px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mb-4">
                                <MessageSquare className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Select a conversation
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                                Choose a conversation from the list to start messaging
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
