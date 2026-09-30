import { useEffect, useRef, useState } from 'react';
import { gsap } from '../../../animations/gsap.config';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

export function AddFriendModal({ open, onClose, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !panelRef.current || !overlayRef.current) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 20, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out', clearProps: 'all' }
    );
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-black p-8"
      >
        <h2 className="text-2xl font-bold text-white">Add a friend</h2>
        <p className="mt-2 text-sm text-white/50">
          Enter their SUPER7 code or name. They'll get a request instantly.
        </p>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="SUPER7-XXXX or name"
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50"
        />

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-white/10 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1 rounded-2xl bg-emerald-400 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}