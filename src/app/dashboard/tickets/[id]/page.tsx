"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardSurface } from "@/components/layout/dashboard-visuals";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getErrorMessage } from "@/lib/errors";
import { ticketApi } from "@/lib/api";
import { TicketDetail } from "@/types";
import { Calendar, Clock, Lock, MessageCircle, Paperclip, Plus, Tag, User } from "lucide-react";

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value?: string): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function initials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

function AvatarChip({ label }: { label: string }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
      {initials(label)}
    </div>
  );
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const detail = await ticketApi.getDetail(ticketId, {
          projectId: searchParams.get("projectId") || undefined,
          projectName: searchParams.get("projectName") || undefined,
          ticketNumber: searchParams.get("ticketNumber") || undefined,
        });
        setTicket(detail);
      } catch (requestError: unknown) {
        setError(getErrorMessage(requestError, "Failed to load ticket"));
      } finally {
        setIsLoading(false);
      }
    };

    if (ticketId) {
      void loadTicket();
    }
  }, [searchParams, ticketId]);

  if (isLoading) {
    return (
      <DashboardCanvas>
        <DashboardContent>
          <div className="flex h-64 items-center justify-center">
            <p>Loading ticket details...</p>
          </div>
        </DashboardContent>
      </DashboardCanvas>
    );
  }

  if (error) {
    return (
      <DashboardCanvas>
        <DashboardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-800">Error loading ticket</h3>
            <p className="mt-1 text-red-600">{error}</p>
            <Button onClick={() => router.back()} className="mt-4" variant="outline">
              Go Back
            </Button>
          </div>
        </DashboardContent>
      </DashboardCanvas>
    );
  }

  if (!ticket) {
    return (
      <DashboardCanvas>
        <DashboardContent>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="font-medium text-yellow-800">Ticket not found</h3>
            <p className="mt-1 text-yellow-600">The requested ticket could not be found.</p>
            <Button onClick={() => router.push("/dashboard/tickets")} className="mt-4">
              Return to Tickets
            </Button>
          </div>
        </DashboardContent>
      </DashboardCanvas>
    );
  }

  return (
    <DashboardCanvas>
      <DashboardContent>
        <DashboardHero
          eyebrow={
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />
              <span>Ticket</span>
            </div>
          }
          title={ticket.title}
          description={`${ticket.ticket_number}${ticket.project_name ? ` • ${ticket.project_name}` : ""}`}
          right={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/tickets")}>
                Back to Tickets
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <DashboardSurface>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticket.description ? (
                    <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
                  ) : (
                    <p className="italic text-gray-500">No description provided</p>
                  )}
                </CardContent>
              </Card>
            </DashboardSurface>

            <DashboardSurface>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ticket.comments && ticket.comments.length > 0 ? (
                      ticket.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <AvatarChip label={comment.user_name} />
                              <span className="font-medium">{comment.user_name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{formatDateTime(comment.timestamp)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-gray-700">{comment.content}</p>
                          {comment.is_internal_note ? (
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                              <Lock className="h-3 w-3" />
                              <span>Internal Note</span>
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="italic text-gray-500">No comments yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DashboardSurface>

            <DashboardSurface>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticket.attachments && ticket.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between rounded border p-2">
                          <div>
                            <p className="text-sm font-medium">{attachment.filename}</p>
                            <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-gray-500">No attachments</p>
                  )}
                </CardContent>
              </Card>
            </DashboardSurface>
          </div>

          <div className="space-y-6">
            <DashboardSurface>
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge>{ticket.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Priority</span>
                    <Badge>{ticket.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Requester</span>
                    <div className="flex items-center gap-2">
                      <AvatarChip label={ticket.requester_name} />
                      <span>{ticket.requester_name}</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">Created</span>
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">Due Date</span>
                      <span>{formatDate(ticket.due_date)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DashboardSurface>

            <DashboardSurface>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assignees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticket.assignee_ids.length > 0 ? (
                    <div className="space-y-2">
                      {ticket.assignee_ids.map((id) => (
                        <div key={id} className="flex items-center gap-2">
                          <AvatarChip label={id} />
                          <span className="text-sm text-slate-700">{id}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="italic text-gray-500">No assignees</p>
                  )}
                </CardContent>
              </Card>
            </DashboardSurface>

            <DashboardSurface>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.length > 0 ? (
                      ticket.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="italic text-gray-500">No tags</p>
                    )}
                  </div>
                  <Button variant="outline" className="mt-3 w-full">
                    <Plus className="mr-1 h-4 w-4" />
                    Add Tag
                  </Button>
                </CardContent>
              </Card>
            </DashboardSurface>
          </div>
        </div>
      </DashboardContent>
    </DashboardCanvas>
  );
}
