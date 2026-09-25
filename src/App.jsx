// src/App.jsx
// HiVocab React Single Page Application Root & Router

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppLayout from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DictionaryPage from './pages/DictionaryPage.jsx';
import VocabularyPage from './pages/VocabularyPage.jsx';
import StudySessionPage from './pages/StudySessionPage.jsx';
import BilingualReadingPage from './pages/BilingualReadingPage.jsx';
import ThptExamPage from './pages/ThptExamPage.jsx';
import PricingPage from './pages/PricingPage.jsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/dictionary" element={<DictionaryPage />} />
                        <Route path="/vocabulary" element={<VocabularyPage />} />
                        <Route path="/study" element={<StudySessionPage />} />
                        <Route path="/reading" element={<BilingualReadingPage />} />
                        <Route path="/exam" element={<ThptExamPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
