// pages/UploadDocumentsPage.tsx

import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ChevronRight,
  File,
  Image,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Trash2,
  Eye,
  Download,
  Sparkles,
  Loader2
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";

// Mock data
const mockBusiness = {
  id: 1,
  name: "Acme Corp - Tech Division",
  workspace: "Acme Corporation",
};

const mockDocuments = [
  {
    id: 1,
    name: "Q4 Financial Report.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "2024-01-15",
    status: "processed",
    pages: 12,
  },
  {
    id: 2,
    name: "Product Roadmap 2024.docx",
    type: "docx",
    size: "856 KB",
    uploadedAt: "2024-01-20",
    status: "processing",
    pages: 8,
  },
  {
    id: 3,
    name: "Market Analysis.xlsx",
    type: "xlsx",
    size: "1.2 MB",
    uploadedAt: "2024-01-22",
    status: "pending",
    pages: 0,
  },
  {
    id: 4,
    name: "Brand Guidelines.png",
    type: "png",
    size: "3.8 MB",
    uploadedAt: "2024-01-25",
    status: "processed",
    pages: 1,
  },
];

const fileIcons = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  png: Image,
  jpg: Image,
  jpeg: Image,
  svg: Image,
  zip: FileArchive,
  rar: FileArchive,
  js: FileCode,
  ts: FileCode,
  py: FileCode,
};

const statusConfig = {
  processed: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Processed" },
  processing: { icon: Loader2, color: "text-amber-400", bg: "bg-amber-500/10", label: "Processing" },
  pending: { icon: Clock, color: "text-[#cbc3d7]", bg: "bg-white/5", label: "Pending" },
  error: { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-500/10", label: "Error" },
};

export default function UploadDocumentsPage() {
  const { businessId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(i);
    }
    
    setIsUploading(false);
    setUploadedFiles([]);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#cbc3d7] mb-6">
        <Link to="/dashboard" className="hover:text-[#dae2fd] transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link to="/workspace" className="hover:text-[#dae2fd] transition-colors">
          Workspace
        </Link>
        <ChevronRight size={14} />
        <Link to="/business" className="hover:text-[#dae2fd] transition-colors">
          Businesses
        </Link>
        <ChevronRight size={14} />
        <span className="text-[#dae2fd] font-medium">Upload Documents</span>
      </nav>

      {/* Header */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-violet-300">
            Upload Documents
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#dae2fd] tracking-tight">
              Upload Documents
            </h1>
            <p className="text-[#cbc3d7] mt-2 text-sm md:text-base">
              Upload documents for <span className="text-[#dae2fd] font-medium">{mockBusiness.name}</span>
            </p>
          </div>

          <Link
            to={`/business/${businessId}/chat`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-[#cbc3d7] transition hover:bg-white/10 hover:text-[#dae2fd]"
          >
            Skip to Chat
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-8">
        <div
          className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 p-8 md:p-12 text-center
            ${isDragging 
              ? "border-violet-400/60 bg-violet-500/10" 
              : "border-white/10 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl hover:border-violet-400/30"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.svg"
          />

          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Upload size={32} className="text-violet-300" />
            </div>

            <div>
              <p className="text-lg font-semibold text-[#dae2fd]">
                {isDragging ? "Drop your files here" : "Drag & drop files here"}
              </p>
              <p className="text-[#cbc3d7] text-sm mt-1">
                or <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-violet-300 hover:text-violet-200 transition"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-[#958ea0] mt-3">
                Supported: PDF, DOCX, XLSX, PNG, JPG, TXT (Max 50MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadedFiles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#dae2fd]">
              Ready to Upload ({uploadedFiles.length} files)
            </h3>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-xs text-[#cbc3d7] hover:text-rose-400 transition"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} className="text-violet-300 flex-shrink-0" />
                  <span className="text-sm text-[#dae2fd] truncate">{file.name}</span>
                  <span className="text-xs text-[#958ea0] flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-lg hover:bg-white/10 transition text-[#cbc3d7] hover:text-rose-400"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#cbc3d7]">Uploading...</span>
                <span className="text-violet-300">{uploadProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading || uploadedFiles.length === 0}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 px-6 py-3 text-sm rounded-xl"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload {uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Document List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#dae2fd]">
              Uploaded Documents ({mockDocuments.length})
            </h3>
            <p className="text-xs text-[#cbc3d7] mt-0.5">Showing all documents</p>
          </div>
        </div>

        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] overflow-hidden rounded-3xl">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-[#958ea0]">
            <div className="col-span-5">Document</div>
            <div className="col-span-2">Pages</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {mockDocuments.map((doc) => {
            const Icon = fileIcons[doc.type as keyof typeof fileIcons] || FileText;
            const status = statusConfig[doc.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            const isHovered = hoveredDoc === doc.id;

            return (
              <div
                key={doc.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-0 items-center transition hover:bg-white/5"
                onMouseEnter={() => setHoveredDoc(doc.id)}
                onMouseLeave={() => setHoveredDoc(null)}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#dae2fd] truncate">{doc.name}</p>
                    <p className="text-xs text-[#958ea0]">{doc.size} • {doc.uploadedAt}</p>
                  </div>
                </div>

                <div className="col-span-2 text-sm text-[#cbc3d7]">
                  {doc.pages > 0 ? `${doc.pages} pages` : '-'}
                </div>

                <div className="col-span-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    <StatusIcon size={12} className={doc.status === "processing" ? "animate-spin" : ""} />
                    {status.label}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition text-[#cbc3d7] hover:text-[#dae2fd]">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 transition text-[#cbc3d7] hover:text-[#dae2fd]">
                    <Download size={16} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-rose-500/10 transition text-[#cbc3d7] hover:text-rose-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Processing Status */}
      <div className="mt-8 p-6 rounded-3xl border border-violet-400/20 bg-violet-500/5 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center animate-pulse">
              <Sparkles size={20} className="text-violet-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#dae2fd]">AI Processing</h4>
              <p className="text-xs text-[#cbc3d7]">Documents are automatically processed for AI analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-6 ml-auto text-xs">
            <div className="text-center">
              <p className="text-[#cbc3d7]">Processed</p>
              <p className="text-[#dae2fd] font-semibold">2</p>
            </div>
            <div className="text-center">
              <p className="text-[#cbc3d7]">Processing</p>
              <p className="text-amber-400 font-semibold">1</p>
            </div>
            <div className="text-center">
              <p className="text-[#cbc3d7]">Pending</p>
              <p className="text-[#cbc3d7] font-semibold">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Proceed to Chat */}
      <div className="mt-8 flex justify-end">
        <Link
          to={`/business/${businessId}/chat`}
          className="inline-flex items-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] px-8 py-3.5 text-base rounded-2xl"
        >
          Proceed to AI Chat
          <ChevronRight size={20} />
        </Link>
      </div>
    </div>
  );
}