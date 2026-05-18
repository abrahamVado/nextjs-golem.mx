"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/errors";
import { publicTicketApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/label";
import { 
  Paperclip, 
  Upload, 
  CheckCircle,
  Loader2
} from "lucide-react";

export type PortalPageData = {
  project_id: string;
  project_name: string;
  company_slug: string;
  slug: string;
  title: string;
  html_template?: string;
  access_mode: "public" | "password_protected" | string;
  is_enabled: boolean;
  requires_password: boolean;
  login_endpoint: string;
  register_endpoint: string;
  ticket_create_endpoint: string;
};

type PortalTicketFormProps = {
  page: PortalPageData;
  initialCompany?: string;
  portalPassword?: string;
};

export default function PortalTicketForm({ page, initialCompany = "", portalPassword = "" }: PortalTicketFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    requester_name: "",
    requester_email: "",
    company: initialCompany,
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "",
    portal_password: portalPassword
  });
  
  // UI state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  // Handle file selection
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };
  
  // Process selected files
  const handleFiles = (files: FileList) => {
    // Convert FileList to array
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setSubmitError(`File ${file.name} exceeds 10MB limit`);
        return;
      }
      
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "text/plain",
        "application/zip"
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setSubmitError(`File type not allowed for ${file.name}`);
        return;
      }
      
      return true;
    });
    
    // Check if adding these files would exceed limits
    const totalFiles = attachments.length + validFiles.length;
    const totalSize = attachments.reduce((sum, file) => sum + file.size, 0) + 
                      validFiles.reduce((sum, file) => sum + file.size, 0);
    
    if (totalFiles > 5) {
      setSubmitError("Maximum 5 attachments allowed");
      return;
    }
    
    if (totalSize > 25 * 1024 * 1024) {
      setSubmitError("Total attachment size exceeds 25MB limit");
      return;
    }
    
    // Add valid files
    setAttachments(prev => [...prev, ...validFiles]);
    setSubmitError(null);
  };
  
  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset state
    setSubmitError(null);
    setSubmitSuccess(false);
    setCreatedTicketId(null);
    setIsSubmitting(true);
    
    try {
      const created = await publicTicketApi.create(page.ticket_create_endpoint, {
        requester_name: formData.requester_name.trim(),
        requester_email: formData.requester_email.trim(),
        company: formData.company.trim() || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        category: formData.category || undefined,
        portal_password: formData.portal_password || undefined,
      });

      setCreatedTicketId(created.id);
      setSubmitSuccess(true);
    } catch (requestError: unknown) {
      setSubmitError(getErrorMessage(requestError, "Failed to submit ticket. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Create New Ticket</CardTitle>
        <CardDescription>
          Please provide as much detail as possible so we can help you quickly.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {submitSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Ticket Submitted Successfully!</h3>
            <p className="text-slate-600 mb-6">
              Thank you for your submission. We&apos;ve sent a confirmation email with your ticket details.
              Our support team will review your request and respond soon.
            </p>
            {createdTicketId ? (
              <p className="mb-6 text-sm text-slate-500">
                Ticket ID: <span className="font-medium text-slate-800">{`TKT-${createdTicketId.slice(0, 8).toUpperCase()}`}</span>
              </p>
            ) : null}
            <Button onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-4 w-4 text-red-500" />
                  <div>
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-600 text-sm">{submitError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requester_name">Full Name *</Label>
                <Input
                  id="requester_name"
                  name="requester_name"
                  value={formData.requester_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requester_email">Email Address *</Label>
                <Input
                  id="requester_email"
                  name="requester_email"
                  type="email"
                  value={formData.requester_email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Enter your company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Subject *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Briefly describe your issue"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Please provide detailed information about your issue"
                className="min-h-[120px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account Management</SelectItem>
                    <SelectItem value="general">General Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleChange}
                  multiple
                  disabled={attachments.length >= 5}
                />
                <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
                <p className="text-slate-600 mb-1">
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-slate-500">
                  Max 5 files, 10MB each (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT, ZIP)
                </p>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Attached files ({attachments.length}/5):
                  </p>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 text-slate-500 mr-2" />
                          <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-slate-500 ml-2">({formatFileSize(file.size)})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </CardContent>
      
      {!submitSuccess && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !formData.requester_name || !formData.requester_email || !formData.title || !formData.description}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Ticket"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
