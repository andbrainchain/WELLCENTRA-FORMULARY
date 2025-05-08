"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DrugDetailsModalProps {
  drug: any
  children: React.ReactNode
}

export default function DrugDetailsModal({ drug, children }: DrugDetailsModalProps) {
  const [open, setOpen] = useState(false)

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(num) ? "N/A" : `$${num.toFixed(2)}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{drug.drugName}</DialogTitle>
          <DialogDescription>
            {drug.hasMatch ? (
              <div className="flex items-center mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">
                  Match Found
                </Badge>
                <span className="text-sm">
                  Potential savings: {formatCurrency(drug.totalSavings)} ({drug.savingsPercent}%)
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 mt-2">
                No Match Found
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teamsters">Teamsters Variants</TabsTrigger>
            <TabsTrigger value="wellcentra">Wellcentra Variants</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Price Comparison</CardTitle>
                <CardDescription>Comparing prices between Teamsters and Wellcentra</CardDescription>
              </CardHeader>
              <CardContent>
                {drug.hasMatch ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium">Teamsters Cost</h4>
                        <p className="text-2xl font-bold">{formatCurrency(drug.teamstersCost)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Wellcentra Price</h4>
                        <p className="text-2xl font-bold">{formatCurrency(drug.wellcentraPrice)}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Savings Breakdown</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Savings</p>
                          <p className="text-lg font-semibold">{formatCurrency(drug.totalSavings)}</p>
                          <p className="text-xs text-muted-foreground">{drug.savingsPercent}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Patient Savings</p>
                          <p className="text-lg font-semibold">{formatCurrency(drug.patientSavings)}</p>
                          <p className="text-xs text-muted-foreground">{drug.patientSavingsPercent}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Plan Savings</p>
                          <p className="text-lg font-semibold">{formatCurrency(drug.planSavings)}</p>
                          <p className="text-xs text-muted-foreground">{drug.planSavingsPercent}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p>No matching data found between Teamsters and Wellcentra for this drug.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teamsters">
            {drug.teamsters && drug.teamsters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Generic Name</TableHead>
                    <TableHead>NDC</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>AWP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drug.teamsters.map((variant: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{variant["Drug Name"] || "N/A"}</TableCell>
                      <TableCell>{variant["Generic Name"] || "N/A"}</TableCell>
                      <TableCell>{variant["NDC"] || "N/A"}</TableCell>
                      <TableCell>{formatCurrency(variant["TOTAL COST"] || 0)}</TableCell>
                      <TableCell>{formatCurrency(variant["AWP"] || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <p>No Teamsters data available for this drug.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="wellcentra">
            {drug.wellcentra && drug.wellcentra.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>NDC</TableHead>
                    <TableHead>Lowest Price</TableHead>
                    <TableHead>WAC Price</TableHead>
                    <TableHead>AWP</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drug.wellcentra.map((variant: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{variant["Drug Name"] || "N/A"}</TableCell>
                      <TableCell>{variant["NDC"] || "N/A"}</TableCell>
                      <TableCell>{formatCurrency(variant["Lowest Price"] || 0)}</TableCell>
                      <TableCell>{formatCurrency(variant["WAC Price"] || 0)}</TableCell>
                      <TableCell>{formatCurrency(variant["AWP"] || 0)}</TableCell>
                      <TableCell>{variant["Source Column"] || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <p>No Wellcentra data available for this drug.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
