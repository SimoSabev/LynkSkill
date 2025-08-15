import {SignedIn, SignedOut, RedirectToSignIn} from "@clerk/nextjs";
import {DesignaliCreative} from "@/components/dashboard"

export default function DashboardPage() {
    return (
        <div>
            <SignedIn>
                <div className="overflow-hidden">
                    <DesignaliCreative />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn/>
            </SignedOut>
        </div>
    );
}
