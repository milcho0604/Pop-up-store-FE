'use client';

import { useState, useRef } from 'react';
import { loadKakaoMaps } from '@/lib/kakao';
import { LocationInfo } from '@/lib/location';

interface Props {
  onSelect: (info: LocationInfo) => void;
}

export default function LocationSearchInput({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setSuggestions([]); setOpen(false); return; }

    timerRef.current = setTimeout(() => {
      loadKakaoMaps().then(() => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(value, (result: any, status: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            setSuggestions(result.slice(0, 5));
            setOpen(true);
          } else {
            setSuggestions([]);
            setOpen(false);
          }
        });
      }).catch(() => {});
    }, 300);
  };

  const handleSelect = (item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const addr = item.address;
    const dong = addr?.region_3depth_name ?? '';
    const gu   = addr?.region_2depth_name ?? '';
    const city = addr?.region_1depth_name ?? '';
    onSelect({
      dong,
      gu,
      city,
      label: [gu, dong].filter(Boolean).join(' ') || city,
    });
    setQuery(item.address_name);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div className="relative mt-2">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="주소·동 이름으로 검색"
          className="w-full pl-8 pr-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                onMouseDown={() => handleSelect(item)}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-800 truncate">{item.address_name}</p>
                {item.road_address && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{item.road_address.address_name}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
