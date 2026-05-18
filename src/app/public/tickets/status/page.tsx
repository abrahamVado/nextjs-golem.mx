"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/label";
import { 
  Search,
  AlertCircle,
  Clock,
  User,
  Calendar,
  MessageCircle
} from "lucide-react";
import { TicketStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

type PublicTicket = {
  id: string;
  title: string;
  status: TicketStatus;
  priority: string; // Will use TicketPriority once available
  created_at: string;
  updated_at: string;
  requester_name: string;
  assignee_name: string | null;
  due_date: string | null;
  description: string;
  comments: {
    id: string;
    author: string;
    timestamp: string;
    content: string;
  }[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function TicketStatusLookupPage() {
  const router = useRouter();
  
  // Form state
  const [ticketId, setTicketId] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  
  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset state
    setSearchError(null);
    setTicket(null);
    setIsSearching(true);
    
    try {
      // In a real implementation, this would fetch from the backend API
      // For now, we'll simulate different responses based on the ticket ID
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock ticket data for demonstration
      if (ticketId === "TKT-12345") {
        setTicket({
          id: "TKT-12345",
          title: "Issue with login authentication",
          status: "Open",
          priority: "HIGH",
          created_at: "2023-06-15T10:30:00Z",
          updated_at: "2023-06-16T14:22:00Z",
          requester_name: "John Doe",
          assignee_name: "Support Team",
          due_date: "2023-06-20T00:00:00Z",
          description: "User is unable to log in to the application with error message 'Invalid credentials'.",
          comments: [
            {
              id: "1",
              author: "Support Agent",
              timestamp: "2023-06-15T11:45:00Z",
              content: "We are investigating this issue and will update you shortly."
            },
            {
              id: "2",
              author: "John Doe",
              timestamp: "2023-06-16T09:15:00Z",
              content: "This is still happening. I've tried resetting my password but no luck."
            }
          ]
        });
      } else if (ticketId === "TKT-98765") {
        setTicket({
          id: "TKT-98765",
          title: "Feature request for mobile app",
          status: "Resolved",
          priority: "MEDIUM",
          created_at: "2023-05-20T14:15:00Z",
          updated_at: "2023-06-01T16:30:00Z",
          requester_name: "Jane Smith",
          assignee_name: "Product Team",
          due_date: null,
          description: "Request for dark mode toggle in the mobile application.",
          comments: []
        });
      } else {
        setSearchError("Ticket not found. Please check your ticket ID and email address.");
      }
    } catch {
      setSearchError("Failed to search for ticket. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Check Ticket Status</h1>
          <p className="text-slate-600">
            Enter your ticket ID and email address to view the current status.
          </p>
        </div>
        
        {!ticket ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Find Your Ticket</CardTitle>
              <CardDescription>
                Enter the ticket ID and your email address to look up the status.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {searchError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />
                      <div>
                        <h3 className="font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-600">{searchError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="ticketId">Ticket ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="ticketId"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      required
                      placeholder="e.g. TKT-12345"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requesterEmail">Your Email Address</Label>
                  <Input
                    id="requesterEmail"
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
              </form>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={handleSubmit} 
                disabled={isSearching || !ticketId || !requesterEmail}
                className="w-full"
              >
                {isSearching ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Ticket
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>Ticket #{ticket.id}</span>
                    <Badge variant={
                      ticket.status === "Open" ? "default" :
                      ticket.status === "Resolved" ? "secondary" : "outline"
                    }>
                      {ticket.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {ticket.title}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => setTicket(null)}>
                  New Search
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">Requester</div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{ticket.requester_name}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">Last Updated</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{formatDate(ticket.updated_at)}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-slate-500">Priority</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ticket.priority === "HIGH" || ticket.priority === "URGENT" ? "bg-red-100 text-red-800" :
                    ticket.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                
                {ticket.due_date && (
                  <div className="space-y-1">
                    <div className="text-sm text-slate-500">Due Date</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatDate(ticket.due_date)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">Description</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              
              {ticket.comments && ticket.comments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-slate-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {ticket.comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-slate-200 pl-4 py-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-sm text-slate-500">
                            {formatDate(comment.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/")}>
                Return to Home
              </Button>
              <Button onClick={() => {}}>
                Add Comment
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Need help? Contact us at support@golemmx.com
          </p>
        </div>
      </div>
    </div>
  );
}
