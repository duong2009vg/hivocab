import os

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>HiVocab – English Vocabulary & IELTS Learning Platform | Application Information</title>
    <meta name="description" content="HiVocab is a web-based English vocabulary, reading comprehension and IELTS learning platform with spaced repetition, exam practice and optional Google Sign-In."/>
    <link rel="canonical" href="{canonical_url}"/>
    <link rel="icon" type="image/svg+xml" href="/logo-mark.svg?v=3"/>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", 'Inter', Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            background-color: #ffffff;
            line-height: 1.65;
        }}
    </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">

    <!-- STATIC DOCUMENT HEADER -->
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <!-- Non-clickable logo and title -->
            <div class="flex items-center gap-2.5 select-none">
                <img src="/logo-mark.svg" alt="HiVocab Logo" class="h-8 w-auto"/>
                <span class="text-xl font-extrabold tracking-tight text-gray-900">HiVocab</span>
            </div>
            
            <div class="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-gray-600">
                <a href="/privacy" class="hover:text-blue-600 transition-colors">Privacy Policy</a>
                <a href="/terms" class="hover:text-blue-600 transition-colors">Terms of Service</a>
            </div>
        </div>
    </header>

    <!-- MAIN INFORMATIONAL DOCUMENT -->
    <main class="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">

        <!-- 1. HEADER & IDENTITY -->
        <section class="text-center space-y-4 border-b border-gray-200 pb-10">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
                <span class="material-symbols-outlined text-sm">school</span>
                English Vocabulary & IELTS Learning Platform
            </div>

            <h1 class="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                HiVocab
            </h1>
            
            <p class="text-base sm:text-lg text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
                Official public documentation and information for HiVocab (<span class="text-gray-900 font-semibold">https://hivocab.site</span>).
            </p>

            <!-- PUBLIC ACCESS STATEMENT -->
            <div class="bg-blue-50/90 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 text-left max-w-2xl mx-auto shadow-sm space-y-3 mt-6">
                <div class="flex items-center gap-2 text-blue-900 font-bold text-base sm:text-lg">
                    <span class="material-symbols-outlined text-blue-600 text-2xl">public</span>
                    <h2>Public Access — No Login Required</h2>
                </div>
                <p class="text-sm text-blue-950 leading-relaxed">
                    This page is publicly accessible and does not require sign-in. Google Sign-In is optional and is not required to view this informational page.
                </p>
                <p class="text-sm text-blue-950 leading-relaxed">
                    HiVocab optionally uses Google Sign-In to authenticate users and provide account synchronization across devices. No login is required to view this documentation.
                </p>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-5 pt-2 text-xs font-semibold text-gray-600">
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-green-600 text-sm">check_circle</span> Public Documentation Page</span>
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-green-600 text-sm">check_circle</span> No Login Required</span>
                <span class="flex items-center gap-1.5"><span class="material-symbols-outlined text-blue-600 text-sm">check_circle</span> Optional Google Sign-In</span>
            </div>
        </section>

        <!-- 2. ABOUT THE APPLICATION & PURPOSE -->
        <section class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">info</span>
                About HiVocab & Application Purpose
            </h2>
            <p class="text-sm sm:text-base text-gray-700 leading-relaxed">
                HiVocab is a web-based English learning application designed to help students, test takers, and language enthusiasts build vocabulary, improve reading comprehension, and systematically prepare for academic English examinations.
            </p>
            <p class="text-sm sm:text-base text-gray-700 leading-relaxed">
                The primary purpose of the application is educational:
            </p>
            <ul class="list-disc pl-6 space-y-2 text-sm sm:text-base text-gray-700">
                <li><strong>Build English Vocabulary:</strong> Mastering active and passive vocabulary through proven memory retention techniques.</li>
                <li><strong>Improve Reading Comprehension:</strong> Developing real-time reading skills using aligned bilingual texts and instant contextual translations.</li>
                <li><strong>Prepare for IELTS Examinations:</strong> Practicing with curated vocabulary from official Cambridge IELTS examination materials (books 10–21).</li>
                <li><strong>Study Academic English:</strong> Preparing for university admissions and national examinations, including the Vietnamese National High School Graduation (THPT Quốc Gia) English examination.</li>
            </ul>
        </section>

        <!-- 3. CORE FEATURES -->
        <section class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">featured_play_list</span>
                Core Application Features
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <span class="material-symbols-outlined text-blue-600 text-lg">update</span>
                        Spaced Repetition System (SRS)
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Built upon the SuperMemo-2 (SM-2) memory retention algorithm. Flashcards are automatically scheduled for review just before memory decay occurs, ensuring long-term retention.
                    </p>
                </div>

                <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <span class="material-symbols-outlined text-indigo-600 text-lg">menu_book</span>
                        Curated Exam Vocabulary
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Structured database of 66,000+ academic vocabulary items extracted and curated from Cambridge IELTS (books 10–21), IELTS Actual Reading Tests, Destination B1–C2, and Oxford 3000 word lists.
                    </p>
                </div>

                <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <span class="material-symbols-outlined text-emerald-600 text-lg">auto_stories</span>
                        Active Bilingual Reading
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Interactive bilingual reading comprehension featuring Curtain Mode (collapsible translation masks), paragraph-by-paragraph parallel alignment, and instant tap-to-translate lookups.
                    </p>
                </div>

                <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <span class="material-symbols-outlined text-purple-600 text-lg">timer</span>
                        THPT Exam Simulator
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Real-time timed examination simulations adhering to official Vietnamese National High School Graduation (THPT Quốc Gia) English test formats, including detailed answer keys.
                    </p>
                </div>

                <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <span class="material-symbols-outlined text-amber-600 text-lg">collections_bookmark</span>
                        Personal Word Notebook
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Learners can bookmark challenging words, record custom context notes, review words grouped by mastery levels (Level 0 through 5), and organize vocabulary by custom topics.
                    </p>
                </div>

                <div class="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <h3 class="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                        <span class="material-symbols-outlined text-rose-600 text-lg">sync</span>
                        Cross-Device Synchronization
                    </h3>
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        Optional cloud synchronization allows learning streaks, review queues, and personal word notebooks to synchronize seamlessly across desktop, tablet, and mobile browsers.
                    </p>
                </div>
            </div>
        </section>

        <!-- 4. GOOGLE OAUTH & DATA USAGE TRANSPARENCY -->
        <section class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">security</span>
                Google Sign-In & Google Data Usage
            </h2>
            
            <div class="bg-gray-50 rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
                <p>
                    HiVocab provides an optional <strong>Sign in with Google</strong> capability. Google Sign-In is completely optional and is only utilized when users choose to store their study progress persistently and synchronize across devices. No login is required to view this public documentation.
                </p>

                <div class="space-y-2">
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base">1. Requested Google OAuth Scopes</h3>
                    <p>HiVocab requests access exclusively to the minimum non-sensitive identity scopes:</p>
                    <div class="bg-white rounded-xl p-4 border border-gray-200 space-y-2 font-mono text-xs">
                        <div><strong class="text-blue-600">openid</strong>: Used to verify user identity via standard OpenID Connect.</div>
                        <div><strong class="text-blue-600">.../auth/userinfo.email</strong>: Used to establish and uniquely identify the user account in our secure database.</div>
                        <div><strong class="text-blue-600">.../auth/userinfo.profile</strong>: Used to display the user's name and avatar within the personalized learning interface.</div>
                    </div>
                </div>

                <div class="space-y-2">
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base">2. Purpose of Requested Data</h3>
                    <ul class="list-disc pl-5 space-y-1">
                        <li>To create and authenticate the user's individual learning account.</li>
                        <li>To personalize and calculate daily Spaced Repetition (SRS) vocabulary review schedules.</li>
                        <li>To store and synchronize bookmarked vocabulary, study streaks, and quiz results across multiple devices.</li>
                    </ul>
                </div>

                <div class="space-y-2">
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base">3. What Is NOT Accessed</h3>
                    <p>HiVocab strictly respects your privacy. We <strong>never</strong> request, access, or read:</p>
                    <ul class="list-disc pl-5 space-y-1">
                        <li>Gmail messages or email metadata</li>
                        <li>Google Drive documents or files</li>
                        <li>Google Calendar entries or schedules</li>
                        <li>Google Contacts or address books</li>
                    </ul>
                </div>

                <div class="space-y-2">
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base">4. Google API Limited Use Verbatim Compliance</h3>
                    <div class="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-gray-800 italic">
                        "HiVocab's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">Google API Services User Data Policy</a>, including the Limited Use requirements."
                    </div>
                    <p class="pt-1">
                        Furthermore, HiVocab commits that Google user data is <strong>never sold</strong>, never shared with third-party advertisers, and <strong>never used to train generalized artificial intelligence or machine learning (AI/ML) models</strong>.
                    </p>
                </div>

                <div class="space-y-2">
                    <h3 class="font-bold text-gray-900 text-sm sm:text-base">5. User Control & Data Deletion</h3>
                    <p>
                        You have full control over your data. You may revoke HiVocab's access to your Google Account at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">Google Account Permissions</a>. You may also request complete deletion of your account and all associated vocabulary progress by emailing <a href="mailto:support@hivocab.site" class="text-blue-600 underline font-semibold"><!--email_off-->support@hivocab.site<!--/email_off--></a>. Requests are processed within 7 business days.
                    </p>
                </div>
            </div>
        </section>

        <!-- 5. DATA PRIVACY & SECURITY -->
        <section class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">lock</span>
                Data Privacy & Security
            </h2>
            <p class="text-sm sm:text-base text-gray-700 leading-relaxed">
                HiVocab applies modern web security standards to protect user data:
            </p>
            <ul class="list-disc pl-6 space-y-2 text-sm sm:text-base text-gray-700">
                <li><strong>Transport Layer Security:</strong> All data transmitted between browsers and servers is encrypted via HTTPS/TLS.</li>
                <li><strong>Row Level Security (RLS):</strong> User study data is protected by Supabase Row Level Security policies, ensuring users can only access their own learning records.</li>
                <li><strong>Token Protection:</strong> Authentication tokens are stored securely in browser storage and are never exposed to unauthorized parties.</li>
            </ul>
        </section>

        <!-- 6. DEVELOPER & PLATFORM INFORMATION -->
        <section class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600">contact_support</span>
                Developer & Platform Information
            </h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm text-gray-700">
                <div>
                    <span class="text-gray-500 text-xs uppercase tracking-wider block">Application Name</span>
                    <strong class="text-gray-900 font-semibold text-base">HiVocab</strong>
                </div>
                <div>
                    <span class="text-gray-500 text-xs uppercase tracking-wider block">Developer / Platform Owner</span>
                    <strong class="text-gray-900 font-semibold text-base">DANG TUNG DUONG</strong>
                </div>
                <div>
                    <span class="text-gray-500 text-xs uppercase tracking-wider block">Country</span>
                    <strong class="text-gray-900 font-semibold">Vietnam</strong>
                </div>
                <div>
                    <span class="text-gray-500 text-xs uppercase tracking-wider block">Official Web Domain</span>
                    <span class="text-gray-900 font-semibold">https://hivocab.site</span>
                </div>
                <div>
                    <span class="text-gray-500 text-xs uppercase tracking-wider block">Support Email</span>
                    <a href=\"mailto:support@hivocab.site\" class=\"text-blue-600 underline font-semibold\"><!--email_off-->support@hivocab.site<!--/email_off--></a>
                </div>
                <div>
                    <span class="text-gray-500 text-xs uppercase tracking-wider block">Support Hotline / Zalo</span>
                    <span class="text-gray-900 font-semibold">(+84) 0846 407 898</span>
                </div>
            </div>
        </section>

    </main>

    <!-- FOOTER -->
    <footer class="bg-gray-900 text-gray-300 py-10 border-t border-gray-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs sm:text-sm">
            <!-- Non-clickable footer logo -->
            <div class="flex items-center gap-2 select-none">
                <img src="/logo-mark.svg" alt="HiVocab Logo" class="h-6 w-auto brightness-200"/>
                <span>© 2026 HiVocab. All rights reserved. Developed by DANG TUNG DUONG.</span>
            </div>

            <div class="flex items-center gap-6 font-medium">
                <a href="/privacy" class="text-gray-300 hover:text-white underline transition-colors">Privacy Policy</a>
                <a href="/terms" class="text-gray-300 hover:text-white underline transition-colors">Terms of Service</a>
            </div>
        </div>
    </footer>

</body>
</html>
"""

def generate_page(output_path, canonical_url):
    html = TEMPLATE.format(canonical_url=canonical_url)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Generated {output_path} with canonical {canonical_url} (size: {len(html)} bytes)")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    index_path = os.path.join(base_dir, 'index.html')
    oauth_home_path = os.path.join(base_dir, 'oauth-home.html')

    generate_page(index_path, 'https://hivocab.site/')
    generate_page(oauth_home_path, 'https://hivocab.site/oauth-home')
