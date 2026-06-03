// src/app/user/[id]/page.jsx
'use client';

import { useParams } from 'next/navigation';
import UserProfile from '@/component/UserProfile.jsx'

export default function UserProfilePage() {
    // useParams() hooks into the folder name [id] 
    // If the browser URL is /user/3, then params.id will equal "3"
    const params = useParams();
    const userId = params.id;

    return (
        <main className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
            <h1 className="text-xl font-medium text-gray-500 mb-4">
                Viewing Profile via Route Parameter
            </h1>

            {/* Rendering your exact component here */}
            <UserProfile userId={userId} />
        </main>
    );
}