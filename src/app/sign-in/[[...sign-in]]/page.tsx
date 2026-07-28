import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a141d] canvas-grid p-4">
            <SignIn />
        </div>
    );
}
