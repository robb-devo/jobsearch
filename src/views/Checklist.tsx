import { Lightbulb } from 'lucide-react';
import { Card, PageHeader, Progress } from '../components/ui';
import { CHECKLIST_GROUPS, TIPS } from '../lib/content';
import { actions, useStore } from '../lib/store';

export default function Checklist() {
  const checked = useStore((s) => s.checklist);
  const total = CHECKLIST_GROUPS.reduce((n, g) => n + g.items.length, 0);
  const done = CHECKLIST_GROUPS.reduce((n, g) => n + g.items.filter((i) => checked[i.id]).length, 0);

  return (
    <>
      <PageHeader
        title="Checkliste"
        description="Alles, was eine starke Bewerbung braucht – Schritt für Schritt. Die Checkliste für einzelne Bewerbungen findest du direkt im Tracker."
        actions={
          <div className="completeness">
            <span>
              {done} von {total} erledigt
            </span>
            <Progress value={done} max={total} tone={done === total ? 'success' : undefined} />
          </div>
        }
      />
      <div className="grid grid-2 align-start">
        {CHECKLIST_GROUPS.map((group) => (
          <Card
            key={group.id}
            title={group.title}
            description={group.description}
            actions={
              <span className="muted small">
                {group.items.filter((i) => checked[i.id]).length}/{group.items.length}
              </span>
            }
          >
            <ul className="checklist">
              {group.items.map((item) => (
                <li key={item.id}>
                  <label className="check">
                    <input type="checkbox" checked={Boolean(checked[item.id])} onChange={() => actions.toggleChecklist(item.id)} />
                    <span>
                      <strong>{item.label}</strong>
                      {item.hint && <small>{item.hint}</small>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card title="Profi-Tipps">
        <ul className="checklist">
          {TIPS.map((tip) => (
            <li key={tip}>
              <div className="check">
                <Lightbulb size={16} className="muted" />
                <span>{tip}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
