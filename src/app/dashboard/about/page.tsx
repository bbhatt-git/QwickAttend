
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Facebook, Github, Instagram, Fingerprint, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
    const appVersion = "1.0.0";

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className='text-center'>
                <div className="inline-flex items-center gap-4 text-primary mb-4">
                    <Fingerprint className="h-12 w-12" />
                    <h1 className="text-5xl font-bold">QwickAttend</h1>
                </div>
                <p className="text-muted-foreground">The seamless attendance tracking solution for modern educators.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5" />
                        Version Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Current version: <strong>{appVersion}</strong></p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>About the Developer</CardTitle>
                    <CardDescription>This application is developed and maintained by Bhupesh Raj Bhatt.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        A passionate developer focused on creating useful and elegant solutions for everyday challenges.
                    </p>
                    <div className="flex items-center justify-center gap-6 pt-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href="https://bbhatt.com.np" target="_blank" rel="noopener noreferrer" aria-label="Website">
                                <Globe className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="icon">
                            <Link href="https://www.facebook.com/share/1BnJr4X2Ec/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <Facebook className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="icon">
                             <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                <Github className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="icon">
                            <Link href="https://www.instagram.com/_bbhatt?igsh=MWdjZnc3Y2t6bXp1bA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
