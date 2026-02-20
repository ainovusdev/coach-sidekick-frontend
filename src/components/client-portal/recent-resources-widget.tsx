'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowRight } from 'lucide-react'
import { useClientResources } from '@/hooks/queries/use-client-resources'
import { CATEGORY_COLORS } from '@/types/resource'
import type { ResourceCategory } from '@/types/resource'

export function RecentResourcesWidget() {
  const { data, isLoading } = useClientResources({ limit: 3 })
  const resources = data?.resources ?? []

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-600" />
            Recent Resources
          </CardTitle>
          <Link href="/client-portal/resources">
            <Button variant="ghost" size="sm" className="text-xs h-7">
              Browse All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No resources shared yet
          </p>
        ) : (
          <div className="space-y-2.5">
            {resources.map(resource => {
              const colors =
                CATEGORY_COLORS[resource.category as ResourceCategory] ||
                CATEGORY_COLORS.general
              return (
                <Link
                  key={resource.id}
                  href={`/client-portal/resources`}
                  className="block"
                >
                  <div className="flex items-center gap-2.5 py-1.5 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {resource.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 ${colors.bg} ${colors.text}`}
                        >
                          {resource.category}
                        </Badge>
                        {!resource.is_viewed && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 font-semibold"
                          >
                            NEW
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
