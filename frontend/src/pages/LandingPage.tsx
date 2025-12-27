import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Link2, FileText, CheckSquare, Users, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Link2,
    title: 'Tool Links',
    description: 'Organize and access all your essential tools in one centralized hub.',
  },
  {
    icon: FileText,
    title: 'Document Sharing',
    description: 'Upload, manage, and share documents seamlessly with your team.',
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
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-cream-50/80 backdrop-blur-md border-b border-charcoal-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-soft">
              <span className="text-white font-serif font-bold text-lg">A</span>
            </div>
            <span className="font-serif font-bold text-xl text-charcoal-900">AMZPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-100 text-gold-700 rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            <span>Simplify your workspace management</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-charcoal-900 mb-6 leading-tight">
            Your team's workspace,{' '}
            <span className="text-gold-500">beautifully organized</span>
          </h1>
          <p className="text-xl text-charcoal-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            AMZPulse brings together your tools, documents, and tasks in one elegant
            workspace. Collaborate with your team and stay focused on what matters.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/sign-up">
              <Button size="lg" variant="primary" className="gap-2">
                Start for free <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button size="lg" variant="outline">
                Sign in to your workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white border-y border-charcoal-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-charcoal-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-charcoal-500 max-w-2xl mx-auto">
              A complete toolkit for managing your team's workspace, designed with simplicity in mind.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-cream-50 rounded-xl border border-charcoal-100 hover:shadow-medium transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-gold-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif font-semibold text-lg text-charcoal-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-charcoal-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-charcoal-800 to-charcoal-900 rounded-2xl p-12 shadow-elevated">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-cream-50 mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-charcoal-300 mb-8 max-w-xl mx-auto">
              Join teams who use AMZPulse to streamline their workspace and boost productivity.
            </p>
            <Link to="/sign-up">
              <Button size="lg" variant="secondary" className="gap-2">
                Create your workspace <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-charcoal-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-serif font-bold text-sm">A</span>
            </div>
            <span className="font-serif font-semibold text-charcoal-700">AMZPulse</span>
          </div>
          <p className="text-sm text-charcoal-400">
            © {new Date().getFullYear()} AMZPulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

