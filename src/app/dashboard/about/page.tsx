
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Facebook, Github, Instagram, Fingerprint, GitBranch, Phone, Mail, Copyright, Info, QrCode, Nfc, LayoutDashboard, User, CalendarOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AboutPage() {
    const appVersion = "1.0.0";
    const currentYear = new Date().getFullYear();

    const features = [
        {
            icon: <QrCode className="h-6 w-6 text-primary" />,
            title: "Effortless QR Scanning",
            description: "Use your device's camera to scan student QR codes instantly."
        },
        {
            icon: <Nfc className="h-6 w-6 text-primary" />,
            title: "NFC Tag Support",
            description: "Take attendance with a tap using in-built or external NFC readers."
        },
        {
            icon: <LayoutDashboard className="h-6 w-6 text-primary" />,
            title: "Real-time Dashboard",
            description: "Get an immediate overview of today's attendance statistics."
        },
        {
            icon: <User className="h-6 w-6 text-primary" />,
            title: "Student Records",
            description: "View and manage student information and attendance history."
        },
        {
            icon: <CalendarOff className="h-6 w-6 text-primary" />,
            title: "Holiday Management",
            description: "Easily schedule single or multi-day school holidays."
        }
    ];

    return (
        <div className="flex justify-center items-start p-4">
            <Card className="w-full max-w-4xl shadow-lg">
                <CardHeader className="text-center bg-muted/50 rounded-t-lg p-8">
                    <div className="mx-auto w-fit bg-primary/10 p-4 rounded-full mb-4">
                        <Fingerprint className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">QwickAttend</h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        The seamless attendance tracking solution for modern educators.
                    </p>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                    
                    <div className="space-y-8">
                        {/* About the App Section */}
                        <div className="space-y-6">
                             <h2 className="text-2xl font-semibold flex items-center gap-2"><Info className='h-6 w-6' /> About the App</h2>
                             <div className='p-6 rounded-lg border bg-background'>
                                <p className="text-muted-foreground mb-4">
                                    QwickAttend is designed to simplify and automate the attendance process for teachers, leveraging modern technology like QR codes and NFC to make tracking fast, accurate, and effortless.
                                </p>
                                <Separator />
                                <div className='mt-4 space-y-2'>
                                    <h3 className="font-semibold flex items-center gap-2"><GitBranch className="h-5 w-5" /> Version</h3>
                                    <p className='text-sm text-muted-foreground'>Current version: <strong>{appVersion}</strong></p>
                                </div>
                             </div>
                        </div>

                        {/* Key Features Section */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">Key Features</h2>
                            <div className='p-6 rounded-lg border bg-background grid gap-6 md:grid-cols-2'>
                               {features.map((feature, index) => (
                                 <div key={index} className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                        </div>


                        {/* Developer Section */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold">About the Developer</h2>
                            <div className='p-6 rounded-lg border bg-background'>
                                <div className="flex items-center space-x-4 mb-6">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">BR</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold">Bhupesh Raj Bhatt</h3>
                                        <p className="text-sm text-muted-foreground">Developer & Maintainer</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <a href="mailto:hello@bbhatt.com.np" className="flex items-center gap-3 text-primary hover:underline transition-colors">
                                        <Mail className="h-5 w-5" />
                                        <span>hello@bbhatt.com.np</span>
                                    </a>
                                    <a href="tel:+9779761184935" className="flex items-center gap-3 text-primary hover:underline transition-colors">
                                       <Phone className="h-5 w-5" />
                                       <span>+977 9761184935</span>
                                    </a>
                                </div>
                                
                                <Separator className="my-6" />

                                <div className="flex items-center justify-center gap-4">
                                    <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10' title="Website">
                                        <Link href="https://bbhatt.com.np" target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-6 w-6" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10' title="Facebook">
                                        <Link href="https://www.facebook.com/share/1BnJr4X2Ec/" target="_blank" rel="noopener noreferrer">
                                            <Facebook className="h-6 w-6" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10' title="GitHub">
                                         <Link href="https://github.com/bbhatt-git" target="_blank" rel="noopener noreferrer">
                                            <Github className="h-6 w-6" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="icon" className='rounded-full h-12 w-12 hover:bg-primary/10' title="Instagram">
                                        <Link href="https://www.instagram.com/_bbhatt?igsh=MWdjZnc3Y2t6bXp1bA==" target="_blank" rel="noopener noreferrer">
                                            <Instagram className="h-6 w-6" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2 pt-4">
                        <Copyright className="h-4 w-4" />
                        <span>{currentYear} QwickAttend. All Rights Reserved.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
