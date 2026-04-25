import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../api/client';

const STATUS_ORDER = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
const LABELS: Record<string, string> = {
  pending: 'New',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  interviewed: 'Interviewed',
  accepted: 'Hired',
  rejected: 'Rejected',
};

export default function AdminKanbanPage() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState<Record<string, any[]>>({
    pending: [],
    reviewing: [],
    shortlisted: [],
    interviewed: [],
    accepted: [],
    rejected: [],
  });
  const [toast, setToast] = useState('');

  const load = async () => setColumns(await api.getAdminKanban());
  useEffect(() => {
    load();
  }, []);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const from = result.source.droppableId;
    const to = result.destination.droppableId;
    if (from === to) return;

    const snapshot = structuredClone(columns);
    const sourceCards = [...columns[from]];
    const [moved] = sourceCards.splice(result.source.index, 1);
    const targetCards = [...columns[to]];
    targetCards.splice(result.destination.index, 0, moved);
    setColumns((prev) => ({ ...prev, [from]: sourceCards, [to]: targetCards }));

    try {
      await api.updateStatus(moved.id, to);
    } catch {
      setColumns(snapshot);
      setToast('Update failed — reverted');
      setTimeout(() => setToast(''), 2200);
    }
  };

  return (
    <div className="page-container">
      {toast && <div className="toast toast-error">{toast}</div>}
      <h1>Applications Kanban</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
          {STATUS_ORDER.map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div className="card" ref={provided.innerRef} {...provided.droppableProps}>
                  <h4>{LABELS[status]}</h4>
                  {(columns[status] || []).map((card, index) => (
                    <Draggable draggableId={card.id} index={index} key={card.id}>
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className="card"
                          style={{ marginBottom: 8, cursor: 'grab' }}
                          onClick={() => navigate(`/admin/applications/${card.id}`)}
                        >
                          <div style={{ fontWeight: 700 }}>{card.avatarInitials}</div>
                          <div>{card.candidateName}</div>
                          <div style={{ fontSize: 12 }}>{card.jobTitle}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
