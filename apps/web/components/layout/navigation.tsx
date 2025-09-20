'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Icons.chart,
  },
  {
    name: 'Research',
    icon: Icons.search,
    children: [
      {
        name: 'Keyword Discovery',
        href: '/research/keyword-discovery',
        icon: Icons.search,
        description: 'Find new keyword opportunities'
      },
      {
        name: 'SERP Analysis',
        href: '/research/serp-analysis',
        icon: Icons.target,
        description: 'Analyze search results'
      },
      {
        name: 'Competitor Research',
        href: '/research/competitor-research',
        icon: Icons.users,
        description: 'Compare with competitors'
      },
    ],
  },
  {
    name: 'History',
    href: '/research/history',
    icon: Icons.clock,
  },
]

export function Navigation() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [researchMenuOpen, setResearchMenuOpen] = useState(false)

  if (status === 'loading') {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.search className="h-6 w-6" />
              <span className="font-semibold">SEO Research Portal</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </nav>
    )
  }

  if (!session) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.search className="h-6 w-6" />
              <span className="font-semibold">SEO Research Portal</span>
            </div>
            <Link href="/auth/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Icons.search className="h-6 w-6" />
            <Link href="/dashboard" className="font-semibold hover:text-primary transition-colors">
              SEO Research Portal
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name} className="relative">
                    <button
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                        pathname.startsWith('/research') && pathname !== '/research/history'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                      onClick={() => setResearchMenuOpen(!researchMenuOpen)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                      <Icons.chevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        researchMenuOpen && "rotate-180"
                      )} />
                    </button>

                    {researchMenuOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-popover border rounded-md shadow-md z-50">
                        <div className="p-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-md transition-colors hover:bg-accent",
                                pathname === child.href && "bg-accent"
                              )}
                              onClick={() => setResearchMenuOpen(false)}
                            >
                              <child.icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium text-sm">{child.name}</div>
                                <div className="text-xs text-muted-foreground">{child.description}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-medium">{session.user?.name}</div>
                <div className="text-xs text-muted-foreground">{session.user?.email}</div>
              </div>
              <Badge variant="outline" className="text-xs">
                {(session.user as any)?.role || 'User'}
              </Badge>
            </div>

            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <Icons.settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Icons.settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="font-medium text-sm px-2 py-1 text-muted-foreground">
                        {item.name}
                      </div>
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-2 py-2 rounded-md transition-colors hover:bg-accent",
                            pathname === child.href && "bg-accent"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <child.icon className="h-4 w-4" />
                          <span className="text-sm">{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-md transition-colors hover:bg-accent",
                      pathname === item.href && "bg-accent"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                )
              })}

              {/* User info on mobile */}
              <div className="pt-4 border-t">
                <div className="px-2">
                  <div className="text-sm font-medium">{session.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{session.user?.email}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {(session.user as any)?.role || 'User'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for dropdowns */}
      {(researchMenuOpen || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setResearchMenuOpen(false)
            setMobileMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}