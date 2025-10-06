import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Scale, FileText, Shield, AlertCircle } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <Scale className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-balance">Terms of Service</h1>
                    <p className="text-muted-foreground text-lg">Last updated: January 2025</p>
                </div>

                {/* Main Content */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Agreement to Terms
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 leading-relaxed">
                        <p>
                            By accessing and using this platform, you accept and agree to be bound by the terms and provision of this
                            agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            User Responsibilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Account Registration</h3>
                            <p className="text-muted-foreground">
                                You must provide accurate, current, and complete information during the registration process. You are
                                responsible for maintaining the confidentiality of your account credentials.
                            </p>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Acceptable Use</h3>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>You will not use the platform for any illegal or unauthorized purpose</li>
                                <li>You will not transmit any malicious code or viruses</li>
                                <li>You will not attempt to gain unauthorized access to any part of the platform</li>
                                <li>You will respect the intellectual property rights of others</li>
                            </ul>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Company Verification</h3>
                            <p className="text-muted-foreground">
                                Companies registering on this platform must provide accurate and verifiable information. Providing false
                                information may result in account termination and legal action under applicable laws, including Article
                                313 of the Bulgarian Penal Code.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Intellectual Property</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            The platform and its original content, features, and functionality are owned by the platform operators and
                            are protected by international copyright, trademark, patent, trade secret, and other intellectual property
                            laws.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Limitation of Liability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            In no event shall the platform, nor its directors, employees, partners, agents, suppliers, or affiliates,
                            be liable for any indirect, incidental, special, consequential or punitive damages, including without
                            limitation, loss of profits, data, use, goodwill, or other intangible losses.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Termination</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We may terminate or suspend your account and bar access to the platform immediately, without prior notice
                            or liability, under our sole discretion, for any reason whatsoever and without limitation, including but
                            not limited to a breach of the Terms.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Changes to Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will
                            provide at least 30 days' notice prior to any new terms taking effect.
                        </p>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="shadow-lg bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Contact Us
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="leading-relaxed">
                        <p className="text-muted-foreground">
                            If you have any questions about these Terms, please contact us at{" "}
                            <a href="mailto:legal@example.com" className="text-primary underline underline-offset-4">
                                legal@example.com
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
