import React from "react";
import { parseISO, isValid, format } from "date-fns";

type MessageBubbleProps = {
  text: string;
  isMine: boolean;
  timestamp: unknown; // string | number | Date | null
  senderName?: string;
  attachmentUrl?: string;
};

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isValid(v) ? v : null;
  if (typeof v === "number") {
    const d = new Date(v);
    return isValid(d) ? d : null;
  }
  if (typeof v === "string") {
    const iso = parseISO(v);
    if (isValid(iso)) return iso;
    const any = new Date(v);
    return isValid(any) ? any : null;
  }
  return null;
}

function safeFormatTime(v: unknown, fmt = "HH:mm") {
  const d = toDate(v);
  return d ? format(d, fmt) : "";
}

export const DateSeparator = ({ date }: { date: unknown }) => {
  const d = toDate(date);
  const label = d ? format(d, "dd/MM/yyyy") : "";
  if (!label) return null;
  return (
    <div className="my-2 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isMine,
  timestamp,
  senderName,
  attachmentUrl,
}) => {
  const hora = safeFormatTime(timestamp);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isMine ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {senderName && !isMine && (
          <div className="text-[10px] opacity-80 mb-1">{senderName}</div>
        )}

        {attachmentUrl && (
          <div className="mb-2">
            {/* Se quiser, renderize imagem/arquivo conforme o tipo */}
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className={`underline ${isMine ? "text-primary-foreground" : "text-foreground"}`}
            >
              Anexo
            </a>
          </div>
        )}

        {text && <div className="whitespace-pre-wrap break-words">{text}</div>}

        <div className={`mt-1 text-[10px] opacity-70 ${isMine ? "text-primary-foreground" : "text-foreground"}`}>
          {hora}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
