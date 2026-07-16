import { useState, useEffect, useCallback } from 'react';
import { StickyNote, Trash2, Send, Loader2 } from 'lucide-react';
import FloatingWindow from './FloatingWindow';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuickNote {
  id: string;
  auditoriaId: string | null;
  supervisorEmail: string;
  supervisorName: string;
  text: string;
  createdAt: string;
  type: string;
  callName: string | null;
}

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotesPanel({ isOpen, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<QuickNote[]>('/api/notas');
      setNotes(res.data || []);
    } catch (e) {
      console.error('Error fetching notes:', e);
      setError('Error al cargar notas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotes();
  }, [isOpen, fetchNotes]);

  const handleAddNote = async () => {
    const text = newNoteText.trim();
    if (!text) return;
    setIsSaving(true);
    try {
      const res = await api.post<QuickNote>('/api/notas', {
        text,
        supervisorName: localStorage.getItem('crm_user_name') || 'Usuario',
      });
      setNotes(prev => [res.data, ...prev]);
      setNewNoteText('');
    } catch (e) {
      console.error('Error creating note:', e);
      setError('Error al crear nota');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (note: QuickNote) => {
    try {
      if (note.auditoriaId) {
        await api.delete('/api/llamadas/' + note.auditoriaId + '/notas/' + note.id);
      } else {
        await api.delete('/api/notas/' + note.id);
      }
      setNotes(prev => prev.filter(n => n.id !== note.id));
    } catch (e) {
      console.error('Error deleting note:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  return (
    <FloatingWindow
      isOpen={isOpen}
      onClose={onClose}
      title="Notas Rápidas"
      icon={<StickyNote className="w-4 h-4 text-primary" />}
      defaultWidth={400}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Add note input */}
        <div className="flex gap-2">
          <Input
            value={newNoteText}
            onChange={e => setNewNoteText(e.target.value)}
            placeholder="Escribe una nota..."
            className="flex-1 text-sm"
            onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={!newNoteText.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* Notes list */}
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 italic">
              No hay notas aún. Escribe tu primera nota arriba.
            </p>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className="group flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground break-words">{note.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{note.supervisorName}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(note.createdAt)}</span>
                    {note.callName && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground truncate">{note.callName}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </FloatingWindow>
  );
}
