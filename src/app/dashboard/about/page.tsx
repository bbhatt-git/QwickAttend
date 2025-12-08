
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Facebook, Github, Instagram, Fingerprint, GitBranch, Phone, Mail, Copyright } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
    const appVersion = "1.0.0";
    const currentYear = new Date().getFullYear();

    return (
        <div className="flex justify-center items-start p-4">
            <Card className="w-full max-w-3xl shadow-lg">
                <CardHeader className="text-center">
                    <div className="inline-flex items-center justify-center gap-4 text-primary mb-4">
                        <Fingerprint className="h-12 w-12" />
                        <h1 className="text-5xl font-bold">QwickAttend</h1>
                    </div>
                    <CardDescription className="text-lg">
                        The seamless attendance tracking solution for modern educators.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-4">
                    
                    <div className='p-6 rounded-lg bg-muted/50'>
                         <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
                            <GitBranch className="h-5 w-5" />
                            Version Information
                        </h2>
                        <p>Current version: <strong>{appVersion}</strong></p>
                    </div>
                   
                    <div className="p-6 rounded-lg bg-muted/50">
                        <h2 className="text-xl font-semibold mb-3">About the Developer</h2>
                        <p className="text-muted-foreground mb-6">
                            This application is developed and maintained by Bhupesh Raj Bhatt, a passionate developer focused on creating useful and elegant solutions for everyday challenges.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <a href="mailto:hello@bbhatt.com.np" className="flex items-center gap-3 text-primary hover:underline transition-colors">
                                <Mail className="h-5 w-5" />
                                <span>hello@bbhatt.com.np</span>
                            </a>
                            <a href="tel:+9779761184935" className="flex items-center gap-3 text-primary hover:underline transition-colors">
                               <Phone className="h-5 w-5" />
                                <span>+977 9761184935</span>
                            </a>
                        </div>

                        <Separator className='my-6' />

                        <div className="flex items-center justify-center gap-6">
                            <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10'>
                                <Link href="https://bbhatt.com.np" target="_blank" rel="noopener noreferrer" aria-label="Website">
                                    <Globe className="h-6 w-6" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10'>
                                <Link href="https://www.facebook.com/share/1BnJr4X2Ec/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                    <Facebook className="h-6 w-6" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10'>
                                 <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                                    <Github className="h-6 w-6" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10'>
                                <Link href="https://www.instagram.com/_bbhatt?igsh=MWdjZnc3Y2t6bXp1bA==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                    <Instagram className="h-6 w-6" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2 pt-4">
                        <Copyright className="h-4 w-4" />
                        <span>{currentYear} QwickAttend. All Rights Reserved.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
