import { useRef } from 'react';
import { Check, ImagePlus, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { fileToDataUrl } from '../lib/photos';
import { Img } from './visuals';

/** Sélection de photos : import local (aperçu, réduit) ou photos d'exemple pour la démo. */
export function PhotoPicker({ value, onChange, samples, multiple = false }: { value: string[]; onChange: (v: string[]) => void; samples: string[]; multiple?: boolean }) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);

  const toggle = (src: string) => {
    if (value.includes(src)) onChange(value.filter((v) => v !== src));
    else onChange(multiple ? [...value, src] : [src]);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).slice(0, 4).map((f) => fileToDataUrl(f)));
    onChange(multiple ? [...value, ...urls] : [urls[0]]);
  };

  const uploaded = value.filter((v) => v.startsWith('data:'));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={() => input.current?.click()}>
          <ImagePlus size={16} /> {t('common.uploadPhoto')}
        </button>
        <input ref={input} type="file" accept="image/*" capture="environment" multiple={multiple} className="hidden" onChange={(e) => onFiles(e.target.files)} />
        {uploaded.map((src) => (
          <div key={src.slice(-40)} className="relative">
            <img src={src} alt="" className="h-16 w-20 rounded-lg object-cover ring-2 ring-primary" />
            <button type="button" className="absolute -end-2 -top-2 rounded-full bg-white p-0.5 shadow" onClick={() => toggle(src)} aria-label={t('common.remove')}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-muted">{t('common.orPickSample')}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {samples.map((src) => {
          const selected = value.includes(src);
          return (
            <button type="button" key={src} onClick={() => toggle(src)} className={`relative shrink-0 overflow-hidden rounded-lg ring-2 ${selected ? 'ring-primary' : 'ring-transparent'}`}>
              <Img src={src.replace('w=1200', 'w=300')} alt="" className="h-16 w-20" />
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center bg-primary/40 text-white">
                  <Check size={22} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
