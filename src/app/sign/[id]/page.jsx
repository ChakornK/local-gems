'use client';

import { useState, use } from 'react';
import { ArrowLeft, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignDetailsPage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    // Toggle between image-focused and text-focused
    const [isTextFocused, setIsTextFocused] = useState(false);

    const sign = {
        id,
        title: "Hidden Waterfall",
        description:
            "Found this amazing hidden waterfall behind the old mill. Great spot for a picnic!",
        image:
            "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=2670&auto=format&fit=crop",
        author: "User1",
        date: "2 hours ago",
        likes: 42
    };

    const heights = isTextFocused
        ? { image: 'h-[33%]', text: 'h-[67%]' }
        : { image: 'h-[67%]', text: 'h-[33%]' };

    return (
        <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Top Bar */}
            <div className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 py-4 flex items-center px-4 relative z-30">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <span className="text-white font-normal text-sm tracking-widest uppercase absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    Sign Detail
                </span>
            </div>

            {/* Image Section */}
            <div
                className={`${heights.image} w-full relative bg-gray-900 transition-all duration-500 ease-in-out`}
            >
                <Image
                    src={sign.image}
                    alt={sign.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            </div>

            {/* Text Section */}
            <div
                className={`
          ${heights.text}
          w-full bg-slate-900 -mt-6 rounded-t-3xl relative z-10
          flex flex-col
          shadow-[0_-8px_30px_rgba(0,0,0,0.5)]
          transition-all duration-500 ease-in-out
        `}
            >
                {/* Arrow Protrusion */}
                <button
                    onClick={() => setIsTextFocused(prev => !prev)}
                    className="
            absolute -top-4 left-1/2 -translate-x-1/2
            w-10 h-10 rounded-full
            bg-slate-800 border border-slate-700
            flex items-center justify-center
            text-slate-300 hover:bg-slate-700
            transition-all
          "
                >
                    <ChevronUp
                        size={18}
                        className={`transition-transform duration-300 ${isTextFocused ? 'rotate-180' : ''
                            }`}
                    />
                </button>

                {/* Header */}
                <div className="p-6 pb-4 border-b border-slate-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">
                                {sign.title}
                            </h1>
                            <p className="text-sm text-slate-400">
                                Posted by @{sign.author}
                            </p>
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                            {sign.date}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-slate-300 leading-relaxed text-base">
                        {sign.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-4 border-t border-slate-800 flex gap-3">
                    <button className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform hover:bg-blue-600">
                        Like ({sign.likes})
                    </button>
                    <button className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform hover:bg-slate-700 border border-slate-700">
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
}
