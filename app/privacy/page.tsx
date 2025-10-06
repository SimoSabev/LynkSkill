import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, Database, Eye, Lock, Cookie, AlertCircle } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                            <ShieldCheck className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-balance">Privacy Policy</h1>
                    <p className="text-muted-foreground text-lg">Last updated: January 2025</p>
                </div>

                {/* Introduction */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Our Commitment to Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We are committed to protecting your personal information and your right to privacy. This Privacy Policy
                            explains how we collect, use, disclose, and safeguard your information when you use our platform.
                        </p>
                    </CardContent>
                </Card>

                {/* Information We Collect */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Information We Collect
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 leading-relaxed">
                        <div>
                            <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                            <p className="text-muted-foreground mb-3">
                                We collect personal information that you voluntarily provide to us when registering on the platform:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Name and contact information (email address)</li>
                                <li>Account credentials (username and password)</li>
                                <li>Profile information (bio, skills, interests)</li>
                                <li>Company information (for company accounts)</li>
                                <li>Date of birth (for student accounts)</li>
                            </ul>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="font-semibold text-lg mb-3">Automatically Collected Information</h3>
                            <p className="text-muted-foreground mb-3">
                                When you access our platform, we automatically collect certain information:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Device and browser information</li>
                                <li>IP address and location data</li>
                                <li>Usage data and analytics</li>
                                <li>Cookies and similar tracking technologies</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* How We Use Your Information */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            How We Use Your Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground mb-3">We use the information we collect or receive:</p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>To facilitate account creation and authentication</li>
                            <li>To provide and maintain our services</li>
                            <li>To send administrative information and updates</li>
                            <li>To improve and personalize user experience</li>
                            <li>To monitor and analyze usage patterns</li>
                            <li>To detect and prevent fraud and abuse</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Data Security */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Data Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We implement appropriate technical and organizational security measures to protect your personal
                            information. However, no electronic transmission over the internet or information storage technology can
                            be guaranteed to be 100% secure.
                        </p>
                        <div className="bg-muted/50 p-4 rounded-lg border border-border">
                            <p className="text-sm">
                                <strong>Security measures include:</strong> encryption of data in transit and at rest, regular security
                                audits, access controls, and secure authentication protocols.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cookies */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cookie className="w-5 h-5" />
                            Cookies and Tracking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We use cookies and similar tracking technologies to track activity on our platform and store certain
                            information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                            sent.
                        </p>
                        <div>
                            <h3 className="font-semibold mb-2">Types of cookies we use:</h3>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>
                                    <strong>Essential cookies:</strong> Required for the platform to function
                                </li>
                                <li>
                                    <strong>Analytics cookies:</strong> Help us understand how users interact with the platform
                                </li>
                                <li>
                                    <strong>Preference cookies:</strong> Remember your settings and preferences
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* GDPR Compliance */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Privacy Rights (GDPR)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground mb-3">
                            If you are a resident of the European Economic Area (EEA), you have certain data protection rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li>
                                <strong>Right to access:</strong> Request copies of your personal data
                            </li>
                            <li>
                                <strong>Right to rectification:</strong> Request correction of inaccurate data
                            </li>
                            <li>
                                <strong>Right to erasure:</strong> Request deletion of your personal data
                            </li>
                            <li>
                                <strong>Right to restrict processing:</strong> Request limitation of data processing
                            </li>
                            <li>
                                <strong>Right to data portability:</strong> Request transfer of your data
                            </li>
                            <li>
                                <strong>Right to object:</strong> Object to our processing of your data
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Data Retention */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Data Retention</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We will retain your personal information only for as long as necessary to fulfill the purposes outlined in
                            this Privacy Policy, unless a longer retention period is required or permitted by law.
                        </p>
                    </CardContent>
                </Card>

                {/* Third-Party Services */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Third-Party Services</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            Our platform may contain links to third-party websites or services that are not operated by us. We have no
                            control over and assume no responsibility for the content, privacy policies, or practices of any
                            third-party sites or services.
                        </p>
                    </CardContent>
                </Card>

                {/* Changes to Policy */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Changes to This Privacy Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 leading-relaxed">
                        <p className="text-muted-foreground">
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                            Privacy Policy on this page and updating the "Last updated" date.
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
                            If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please
                            contact us at{" "}
                            <a href="mailto:privacy@example.com" className="text-primary underline underline-offset-4">
                                privacy@example.com
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
