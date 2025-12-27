import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Link2, CheckSquare, Users, ArrowRight, Sparkles } from 'lucide-react';
import { HandPulseIcon } from '@/components/icons/HandPulseIcon';

const features = [
  {
    icon: Link2,
    title: 'Tool Links',
    description: 'Organize and access all your essential tools in one centralized hub.',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Create and track tasks to keep your projects moving forward.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together efficiently with role-based access and invitations.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-theme-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-theme-background/80 backdrop-blur-md border-b border-theme-light z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-theme-primary rounded-lg flex items-center justify-center shadow-soft">
              <HandPulseIcon size={20} color="white" strokeWidth={2} />
            </div>
            <span className="font-serif font-bold text-xl text-theme-primary">AMZPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sign-in">
              <Button variant="ghost" className="text-theme-primary">Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        {/* Decorative background element for Netflix feel in dark mode */}
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-40">
          <div className="absolute inset-0 bg-gradient-to-t from-theme-background via-transparent to-theme-background" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>Simplify your workspace management</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-theme-primary mb-6 leading-tight">
            Unlimited Productivity,{' '}
            <span className="text-theme-primary">One Workspace</span>
          </h1>
          <p className="text-xl md:text-2xl text-theme-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Ready to work? Join AMZPulse to organize your tools and tasks in one elegant hub.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link to="/sign-up" className="w-full md:w-auto">
              <Button size="lg" variant="primary" className="w-full md:w-auto gap-2 text-xl py-6 px-8 rounded-md">
                Get Started <ArrowRight size={24} />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-theme-tertiary">
            Starts for free. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-theme-surface border-y border-theme-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-theme-primary mb-4">
              Everything you need
            </h2>
            <p className="text-lg md:text-xl text-theme-secondary max-w-2xl mx-auto">
              A complete toolkit for managing your team's workspace, designed with simplicity in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 bg-theme-background rounded-xl border border-theme-light hover:border-theme-primary transition-all duration-300"
              >
                <div className="w-14 h-14 bg-theme-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon size={28} className="text-theme-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif font-semibold text-xl text-theme-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-theme-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-theme-surface rounded-2xl p-16 shadow-elevated border border-theme-light">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-theme-primary mb-6">
              Ready to create your workspace?
            </h2>
            <p className="text-xl text-theme-secondary mb-10 max-w-xl mx-auto">
              Join teams who use AMZPulse to streamline their workspace and boost productivity.
            </p>
            <Link to="/sign-up">
              <Button size="lg" variant="primary" className="gap-2 text-xl py-6 px-10 rounded-md">
                Get Started Now <ArrowRight size={24} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-theme-light bg-theme-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-theme-primary rounded-lg flex items-center justify-center">
              <HandPulseIcon size={20} color="white" strokeWidth={2} />
            </div>
            <span className="font-serif font-bold text-xl text-theme-primary">AMZPulse</span>
          </div>
          <div className="flex gap-8 text-theme-tertiary text-sm">
            <a href="#" className="hover:text-theme-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-theme-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-theme-primary transition-colors">Contact Us</a>
          </div>
          <p className="text-sm text-theme-tertiary">
            © {new Date().getFullYear()} AMZPulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

