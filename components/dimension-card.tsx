"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { DimensionScore } from "@/lib/schemas";

export function DimensionCard({ dimension }: { dimension: DimensionScore }) {
  const percentage = dimension.disabled ? 0 : ((dimension.score || 0) / dimension.max_score) * 100;

  return (
    <Card>
      <Accordion>
        <AccordionItem value={dimension.id}>
          <AccordionTrigger value={dimension.id} className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground">{dimension.id}</span>
                <span className="font-medium">{dimension.name}</span>
                {dimension.disabled && <Badge variant="secondary">N/A</Badge>}
                {dimension.capped && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Capped</Badge>}
              </div>
              <div className="text-sm font-semibold">
                {dimension.disabled ? <span className="text-muted-foreground">Disabled</span> : (
                  <span>{dimension.score} <span className="text-muted-foreground font-normal">/ {dimension.max_score}</span></span>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent value={dimension.id}>
            <div className="space-y-3 pt-2">
              {dimension.disabled ? (
                <p className="text-sm text-muted-foreground">{dimension.disabled_reason}</p>
              ) : (
                <>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Band</div>
                    <Badge variant="outline">{dimension.band}</Badge>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Reasoning</div>
                    <p className="text-sm leading-relaxed">{dimension.reasoning}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Quick Fix</div>
                    <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">{dimension.quick_fix}</p>
                  </div>
                  {dimension.capped_reason && (
                    <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                      <span className="font-medium">Cap applied:</span> {dimension.capped_reason}
                    </div>
                  )}
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
