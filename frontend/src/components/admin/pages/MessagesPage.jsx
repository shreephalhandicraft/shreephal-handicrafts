import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Eye,
  CheckCircle,
  RefreshCw,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";

export function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all messages first, then filter by unread
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching messages...");

      // First, let's try to fetch ALL messages to see if the connection works
      const { data: allData, error: allError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("All messages:", allData);
      console.log("All messages error:", allError);

      if (allError) {
        throw allError;
      }

      // Now filter for unread messages
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      console.log("Unread messages:", data);
      console.log("Unread messages error:", error);

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast({
        title: "Error fetching messages",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark one message as read
  const markAsRead = async (id) => {
    try {
      console.log("Marking message as read:", id);

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Message marked as read",
      });

      // Close dialog if this message was being viewed
      if (selectedMessage && selectedMessage.id === id) {
        setIsDialogOpen(false);
        setSelectedMessage(null);
      }

      // Refetch messages to update the list
      await fetchMessages();
    } catch (err) {
      console.error("Mark as read error:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // View message details
  const viewMessage = (message) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
  };

  // Test Supabase connection
  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("count(*)", { count: "exact" });

      console.log("Connection test - count:", data);
      console.log("Connection test - error:", error);
    } catch (err) {
      console.error("Connection test failed:", err);
    }
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 2) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    testConnection();
    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-lg font-medium">Loading messages...</div>
          <div className="text-sm text-muted-foreground">Please wait while we fetch your messages</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div className="text-xl font-semibold">Something went wrong</div>
          <div className="text-muted-foreground max-w-md">{error}</div>
        </div>
        <Button onClick={fetchMessages} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground text-lg">
            Manage customer inquiries and communications
          </p>
        </div>
        <Button onClick={fetchMessages} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">
              New message{messages.length !== 1 ? 's' : ''} awaiting response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">&lt; 2h</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages.filter(m => m.subject?.toLowerCase().includes('urgent')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgent messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <div className="text-xl font-semibold mb-2">No new messages</div>
            <div className="text-muted-foreground mb-6">
              All caught up! Check back later for new customer inquiries.
            </div>
            <Button onClick={fetchMessages} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Check Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Subject</TableHead>
                  <TableHead className="font-semibold">Preview</TableHead>
                  <TableHead className="font-semibold">Received</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{msg.name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {msg.email}
                          </div>
                          {msg.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {msg.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium text-sm">
                        {msg.subject || "No Subject"}
                      </div>
                    </TableCell>
                    
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-muted-foreground truncate">
                        {msg.message}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(msg.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {msg.subject?.toLowerCase().includes('urgent') ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Urgent
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewMessage(msg)}
                          className="gap-2 hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(msg.id)}
                          className="gap-2 hover:bg-green-50 hover:border-green-300"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Read
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader className="space-y-4 pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl">
                      {selectedMessage.subject || "No Subject"}
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Message from {selectedMessage.name}
                    </DialogDescription>
                  </div>
                  {selectedMessage.subject?.toLowerCase().includes('urgent') && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Urgent
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span className="text-muted-foreground">{selectedMessage.email}</span>
                    </div>
                    {selectedMessage.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span className="text-muted-foreground">{selectedMessage.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Received:</span>
                      <span className="text-muted-foreground">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Message Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => markAsRead(selectedMessage.id)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Read
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
