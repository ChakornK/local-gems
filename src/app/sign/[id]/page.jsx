'use client';

import { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignDetailsPage({ params }) {
    const router = useRouter();
    const { id } = use(params);

    // Dummy data for now
    const sign = {
        id,
        title: "Hidden Waterfall",
        description: "Found this amazing hidden waterfall behind the old mill. Great spot for a picnic!",
        image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=2670&auto=format&fit=crop",
        author: "User1",
        date: "2 hours ago",
        likes: 42
    };

    return (
        <div className="h-screen w-full flex flex-col bg-slate-900">
            {/* Topic Bar */}
            <div className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 py-4 flex items-center justify-center relative z-20">
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="text-white font-normal text-sm tracking-widest uppercase">
                    Sign Detail
                </span>
            </div>

            {/* 
                Top section contains the image
                Takes up 1/3 of the height (h-1/3) as per user intent
            */}
            <div className="h-1/3 w-full relative bg-gray-900">
                {/* The Image */}
                <Image
                    src={sign.image}
                    alt={sign.title}
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* 
                Bottom section contains the text by the user
                Takes up the remaining space (flex-1)
                Rounded corners at top to look like a sheet
            */}
            <div className="flex-1 w-full bg-slate-900 -mt-6 rounded-t-3xl relative z-10 p-6 flex flex-col gap-4 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">

                {/* Header: Title and Time */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{sign.title}</h1>
                        <p className="text-sm text-white">Posted by @{sign.author}</p>
                    </div>
                    <span className="text-xs text-white bg-transparent px-2 py-1">
                        {sign.date}
                    </span>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gray-100" />

                {/* Description Body */}
                <div className="flex-1 overflow-y-auto">
                    <p className="text-slate-300 leading-relaxed text-base">
                        {sign.description}
                    </p>
                </div>

                {/* Bottom Action Bar (Like/Share) */}
                <div className="pt-4 mt-auto border-t border-gray-100 flex gap-3">
                    <button className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform">
                        Like ({sign.likes})
                    </button>
                    <button className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform">
                        Share
                    </button>
                </div>

            </div>
        </div>
    );
}
