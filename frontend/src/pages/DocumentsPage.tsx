import { useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, Button, Input } from '@/components/ui';
import {
  Upload,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  Share2,
  Trash2,
  Search,
  Grid,
  List,
  Check,
  Pencil,
  X,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  shared: boolean;
}

const initialDocuments: Document[] = [
  { id: '1', name: 'Q4 Financial Report.pdf', description: 'Quarterly financial summary including revenue, expenses, and projections.', type: 'pdf', size: '2.4 MB', uploadedBy: 'John Doe', uploadedAt: '2 hours ago', shared: true },
  { id: '2', name: 'Team Photo.png', description: 'Company team photo from the annual retreat.', type: 'image', size: '5.1 MB', uploadedBy: 'Jane Smith', uploadedAt: 'Yesterday', shared: false },
  { id: '3', name: 'Budget 2024.xlsx', description: 'Annual budget spreadsheet with department allocations.', type: 'spreadsheet', size: '1.2 MB', uploadedBy: 'Mike Johnson', uploadedAt: '3 days ago', shared: true },
  { id: '4', name: 'Project Proposal.pdf', description: 'New product launch proposal with timeline and resources.', type: 'pdf', size: '890 KB', uploadedBy: 'Sarah Wilson', uploadedAt: 'Last week', shared: false },
  { id: '5', name: 'Meeting Notes.pdf', description: 'Notes from the weekly team standup meeting.', type: 'pdf', size: '156 KB', uploadedBy: 'John Doe', uploadedAt: 'Last week', shared: true },
  { id: '6', name: 'Design Assets.zip', description: 'Brand assets including logos, icons, and color palettes.', type: 'other', size: '45.2 MB', uploadedBy: 'Jane Smith', uploadedAt: '2 weeks ago', shared: false },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return FileText;
    case 'image':
      return FileImage;
    case 'spreadsheet':
      return FileSpreadsheet;
    default:
      return File;
  }
};

const getFileColor = (type: string) => {
  switch (type) {
    case 'pdf':
      return 'bg-red-100 text-red-600';
    case 'image':
      return 'bg-green-100 text-green-600';
    case 'spreadsheet':
      return 'bg-emerald-100 text-emerald-600';
    default:
      return 'bg-charcoal-100 text-charcoal-600';
  }
};

export function DocumentsPage() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
        const newDocs: Document[] = Array.from(files).map((file, index) => ({
          id: Date.now().toString() + index,
          name: file.name,
          description: '',
          type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'other',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          uploadedBy: user?.fullName || 'You',
          uploadedAt: 'Just now',
          shared: false,
        }));
        setDocuments([...newDocs, ...documents]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const toggleShare = (id: string) => {
    setDocuments(documents.map((d) => (d.id === id ? { ...d, shared: !d.shared } : d)));
  };

  const openEditModal = (doc: Document) => {
    setEditingDoc(doc);
    setEditForm({ name: doc.name, description: doc.description });
  };

  const closeEditModal = () => {
    setEditingDoc(null);
    setEditForm({ name: '', description: '' });
  };

  const handleEditSave = () => {
    if (editingDoc) {
      setDocuments(documents.map((d) =>
        d.id === editingDoc.id
          ? { ...d, name: editForm.name, description: editForm.description }
          : d
      ));
      closeEditModal();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">Documents</h1>
          <p className="text-charcoal-500">Upload, manage, and share documents with your team.</p>
        </div>
        {isAdmin && (
          <Button onClick={handleUploadClick} className="gap-2" disabled={isUploading}>
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} /> Upload
              </>
            )}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <Input
            type="search"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex bg-white rounded-lg border border-charcoal-200 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-cream-100 text-charcoal-800' : 'text-charcoal-400 hover:text-charcoal-600'
            }`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-cream-100 text-charcoal-800' : 'text-charcoal-400 hover:text-charcoal-600'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.type);
            return (
              <Card key={doc.id} variant="elevated" className="group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getFileColor(doc.type)}`}>
                    <FileIcon size={24} strokeWidth={1.5} />
                  </div>
                  {doc.shared && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                      <Check size={12} /> Shared
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-charcoal-900 mb-1 truncate" title={doc.name}>
                  {doc.name}
                </h3>
                {doc.description && (
                  <p className="text-sm text-charcoal-500 mb-2 line-clamp-2" title={doc.description}>
                    {doc.description}
                  </p>
                )}
                <p className="text-xs text-charcoal-400 mb-3">
                  {doc.size} • {doc.uploadedAt}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-charcoal-100 mt-auto">
                  <span className="text-xs text-charcoal-400">by {doc.uploadedBy}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 rounded-lg">
                      <Download size={16} />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-1.5 text-charcoal-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg"
                          title="Edit document"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => toggleShare(doc.id)}
                          className={`p-1.5 rounded-lg ${
                            doc.shared
                              ? 'text-green-500 hover:bg-green-50'
                              : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                          }`}
                        >
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-charcoal-100">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.type);
              return (
                <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-cream-50 transition-colors group">
                  <div className={`p-2 rounded-lg ${getFileColor(doc.type)}`}>
                    <FileIcon size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-charcoal-900 truncate">{doc.name}</h3>
                    {doc.description && (
                      <p className="text-sm text-charcoal-500 truncate" title={doc.description}>{doc.description}</p>
                    )}
                    <p className="text-xs text-charcoal-400">{doc.size} • Uploaded by {doc.uploadedBy}</p>
                  </div>
                  <span className="text-sm text-charcoal-400 hidden sm:block">{doc.uploadedAt}</span>
                  {doc.shared && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center gap-1">
                      <Check size={12} /> Shared
                    </span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 rounded-lg">
                      <Download size={16} />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-2 text-charcoal-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg"
                          title="Edit document"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => toggleShare(doc.id)}
                          className={`p-2 rounded-lg ${
                            doc.shared
                              ? 'text-green-500 hover:bg-green-50'
                              : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100'
                          }`}
                        >
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-charcoal-300" />
          </div>
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">No documents found</h3>
          <p className="text-charcoal-500">
            {searchQuery ? 'Try a different search term.' : isAdmin ? 'Upload your first document to get started.' : 'No documents have been uploaded yet.'}
          </p>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-charcoal-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-elevated max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif font-bold text-xl text-charcoal-900">Edit Document</h2>
              <button
                onClick={closeEditModal}
                className="p-2 text-charcoal-400 hover:text-charcoal-600 hover:bg-cream-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Document Name
                </label>
                <Input
                  type="text"
                  value={editForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Enter document name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Enter a short description of this document..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-charcoal-200 rounded-lg text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={closeEditModal} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={handleEditSave} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
