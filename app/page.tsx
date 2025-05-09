"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DownloadIcon, SearchIcon, PlusCircleIcon, ChevronDownIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { processFormularies } from "@/lib/formulary-processor"
import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import { teamstersData, wellcentraData } from "@/lib/sample-data"
import DrugDetailsModal from "@/components/drug-details-modal"

export default function FormularyAnalyzer() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({
    key: "drugName",
    direction: "asc",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Process the data automatically on component mount
    processData()
  }, [])

  const processData = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      // Process the data using the provided formularies
      const analysisResults = processFormularies(teamstersData, wellcentraData)
      setResults(analysisResults)
    } catch (err) {
      setError(`Error processing formulary data: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const exportToExcel = () => {
    if (!results) return

    const workbook = XLSX.utils.book_new()

    // Add all drugs sheet
    const allDrugsSheet = XLSX.utils.json_to_sheet(
      results.allDrugs.map((drug: any) => ({
        "Drug Name": drug["Drug Name"],
        "Generic Name": drug["Generic Name"] || "N/A",
        NDC: drug["NDC"] || "N/A",
        Source: drug.Source,
        "Teamsters Cost": drug.Source === "Teamsters" ? drug["TOTAL COST"] : "",
        "Wellcentra Price": drug.Source === "Wellcentra" ? drug["Lowest Price"] : "",
        AWP: drug["AWP"] || "",
        "WAC Price": drug["WAC Price"] || "",
      })),
    )
    XLSX.utils.book_append_sheet(workbook, allDrugsSheet, "All Drugs")

    // Add savings analysis sheet
    const savingsSheet = XLSX.utils.json_to_sheet(
      results.drugsWithSavings
        .filter((drug: any) => drug.hasMatch)
        .map((drug: any) => ({
          "Drug Name": drug.drugName,
          "Teamsters Cost": drug.teamstersCost,
          "Wellcentra Price": drug.wellcentraPrice,
          "Total Savings": drug.totalSavings,
          "Savings %": drug.savingsPercent + "%",
          "Patient Savings": drug.patientSavings,
          "Plan Savings": drug.planSavings,
        })),
    )
    XLSX.utils.book_append_sheet(workbook, savingsSheet, "Savings Analysis")

    // Add summary sheet
    const summaryData = [
      { Metric: "Total unique drugs", Value: results.summary.totalDrugs },
      { Metric: "Matched drugs", Value: results.summary.matchedDrugs },
      { Metric: "Teamsters only drugs", Value: results.summary.teamstersOnly },
      { Metric: "Wellcentra only drugs", Value: results.summary.wellcentraOnly },
      { Metric: "Total Teamsters cost", Value: `$${results.summary.totalTeamstersCost.toFixed(2)}` },
      { Metric: "Total Wellcentra price", Value: `$${results.summary.totalWellcentraPrice.toFixed(2)}` },
      { Metric: "Total potential savings", Value: `$${results.summary.totalSavings.toFixed(2)}` },
      { Metric: "Total patient savings", Value: `$${results.summary.totalPatientSavings.toFixed(2)}` },
      { Metric: "Total plan savings", Value: `$${results.summary.totalPlanSavings.toFixed(2)}` },
      { Metric: "Overall savings percentage", Value: `${results.summary.overallSavingsPercent.toFixed(2)}%` },
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    FileSaver.saveAs(blob, "formulary_analysis.xlsx")
  }

  // Filter and sort drugs
  const getFilteredAndSortedDrugs = () => {
    if (!results) return []

    let filtered = results.drugsWithSavings

    // Apply tab filtering
    if (activeTab === "matches") {
      filtered = filtered.filter((drug: any) => drug.hasMatch)
    } else if (activeTab === "teamsters") {
      filtered = filtered.filter((drug: any) => drug.teamsters && drug.teamsters.length > 0)
    } else if (activeTab === "wellcentra") {
      filtered = filtered.filter((drug: any) => drug.wellcentra && drug.wellcentra.length > 0)
    }

    // Filter out drugs with $0 price
    filtered = filtered.filter((drug: any) => {
      // For Teamsters drugs
      if (drug.teamsters && drug.teamsters.length > 0) {
        const teamstersCost = Number.parseFloat(drug.teamstersCost)
        if (teamstersCost <= 0) return false
      }

      // For Wellcentra drugs
      if (drug.wellcentra && drug.wellcentra.length > 0) {
        const wellcentraPrice = Number.parseFloat(drug.wellcentraPrice)
        if (wellcentraPrice <= 0) return false
      }

      // Keep drugs that have at least one non-zero price
      return true
    })

    // Apply search filtering
    if (searchTerm) {
      filtered = filtered.filter((drug: any) => drug.drugName.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        // Handle numeric sorting
        if (!isNaN(Number.parseFloat(aValue)) && !isNaN(Number.parseFloat(bValue))) {
          return sortConfig.direction === "asc"
            ? Number.parseFloat(aValue) - Number.parseFloat(bValue)
            : Number.parseFloat(bValue) - Number.parseFloat(aValue)
        }

        // Handle string sorting
        const aString = String(aValue || "")
        const bString = String(bValue || "")

        return sortConfig.direction === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString)
      })
    }

    return filtered
  }

  // Get paginated data
  const getPaginatedData = () => {
    const filteredAndSorted = getFilteredAndSortedDrugs()
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSorted.slice(startIndex, startIndex + itemsPerPage)
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc"
    }

    setSortConfig({ key, direction })
  }

  const formatCurrency = (value: string | number) => {
    if (value === null || value === undefined) return "N/A"
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    return isNaN(num) ? "N/A" : `$${num.toFixed(2)}`
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1) // Reset to first page when changing tabs
  }

  const totalPages = results ? Math.ceil(getFilteredAndSortedDrugs().length / itemsPerPage) : 0

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Pharmacy Formulary Analyzer</h1>
      <h2 className="text-xl text-center mb-8">Teamsters vs. Wellcentra Comparison</h2>

      {isProcessing ? (
        <div className="flex justify-center my-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4">Processing formulary data...</p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : results ? (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Drugs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{results.summary.totalDrugs}</div>
                <div className="text-sm text-muted-foreground mt-1">{results.summary.matchedDrugs} matched drugs</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${results.summary.totalSavings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {results.summary.overallSavingsPercent.toFixed(2)}% overall savings
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Patient Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${results.summary.totalPatientSavings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground mt-1">20% of total savings</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Plan Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${results.summary.totalPlanSavings.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground mt-1">80% of total savings</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Complete Drug List</CardTitle>
                <Button variant="outline" onClick={exportToExcel}>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
              <CardDescription>
                Showing all drugs from both formularies (total: {results.drugsWithSavings.length})
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="all" onValueChange={handleTabChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Drugs</TabsTrigger>
                  <TabsTrigger value="matches">Matches Only</TabsTrigger>
                  <TabsTrigger value="teamsters">Teamsters Only</TabsTrigger>
                  <TabsTrigger value="wellcentra">Wellcentra Only</TabsTrigger>
                </TabsList>

                <div className="flex items-center mb-4">
                  <SearchIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input
                    placeholder="Search drugs..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page when searching
                    }}
                    className="max-w-sm"
                  />
                </div>

                <TabsContent value="all">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("drugName")}
                          >
                            <div className="flex items-center">
                              Drug Name
                              {sortConfig?.key === "drugName" && (
                                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Sources</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("teamstersCost")}
                          >
                            <div className="flex items-center">
                              Teamsters Cost
                              {sortConfig?.key === "teamstersCost" && (
                                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("wellcentraPrice")}
                          >
                            <div className="flex items-center">
                              Wellcentra Price
                              {sortConfig?.key === "wellcentraPrice" && (
                                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort("totalSavings")}
                          >
                            <div className="flex items-center">
                              Savings
                              {sortConfig?.key === "totalSavings" && (
                                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                              )}
                            </div>
                          </TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedData().map((drug: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{drug.drugName}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {drug.teamsters && drug.teamsters.length > 0 && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Teamsters
                                  </Badge>
                                )}
                                {drug.wellcentra && drug.wellcentra.length > 0 && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Wellcentra
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {drug.teamsters && drug.teamsters.length > 0 ? (
                                drug.teamsters.length === 1 ? (
                                  formatCurrency(drug.teamstersCost)
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        {formatCurrency(drug.teamstersCost)}
                                        <ChevronDownIcon className="h-3 w-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                      {drug.teamsters.map((variant: any, i: number) => (
                                        <DropdownMenuItem key={i} className="text-xs">
                                          {variant["Generic Name"] || variant["Drug Name"]}:{" "}
                                          {formatCurrency(variant["TOTAL COST"])}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              {drug.wellcentra && drug.wellcentra.length > 0 ? (
                                drug.wellcentra.length === 1 ? (
                                  formatCurrency(drug.wellcentraPrice)
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                                        {formatCurrency(drug.wellcentraPrice)}
                                        <ChevronDownIcon className="h-3 w-3 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                      {drug.wellcentra.map((variant: any, i: number) => (
                                        <DropdownMenuItem key={i} className="text-xs">
                                          {variant["Drug Name"]}: {formatCurrency(variant["Lowest Price"])}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              {drug.hasMatch ? (
                                <div>
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(drug.totalSavings)}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">({drug.savingsPercent}%)</span>
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              <DrugDetailsModal drug={drug}>
                                <Button variant="ghost" size="sm" className="h-8">
                                  <PlusCircleIcon className="h-4 w-4" />
                                </Button>
                              </DrugDetailsModal>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="matches">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Drug Name</TableHead>
                          <TableHead>Teamsters Cost</TableHead>
                          <TableHead>Wellcentra Price</TableHead>
                          <TableHead>Total Savings</TableHead>
                          <TableHead>Patient Savings</TableHead>
                          <TableHead>Plan Savings</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedData().map((drug: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{drug.drugName}</TableCell>
                            <TableCell>{formatCurrency(drug.teamstersCost)}</TableCell>
                            <TableCell>{formatCurrency(drug.wellcentraPrice)}</TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium text-green-600">{formatCurrency(drug.totalSavings)}</span>
                                <span className="text-xs text-muted-foreground ml-1">({drug.savingsPercent}%)</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(drug.patientSavings)}</TableCell>
                            <TableCell>{formatCurrency(drug.planSavings)}</TableCell>
                            <TableCell>
                              <DrugDetailsModal drug={drug}>
                                <Button variant="ghost" size="sm" className="h-8">
                                  <PlusCircleIcon className="h-4 w-4" />
                                </Button>
                              </DrugDetailsModal>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="teamsters">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Drug Name</TableHead>
                          <TableHead>Generic Name</TableHead>
                          <TableHead>NDC</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedData().map((drug: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{drug.drugName}</TableCell>
                            <TableCell>
                              {drug.teamsters && drug.teamsters.length > 0
                                ? drug.teamsters[0]["Generic Name"] || "N/A"
                                : "N/A"}
                              {drug.teamsters && drug.teamsters.length > 1 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (+{drug.teamsters.length - 1} more)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {drug.teamsters && drug.teamsters.length > 0 ? drug.teamsters[0]["NDC"] || "N/A" : "N/A"}
                              {drug.teamsters && drug.teamsters.length > 1 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (+{drug.teamsters.length - 1} more)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatCurrency(drug.teamstersCost)}</TableCell>
                            <TableCell>
                              <DrugDetailsModal drug={drug}>
                                <Button variant="ghost" size="sm" className="h-8">
                                  <PlusCircleIcon className="h-4 w-4" />
                                </Button>
                              </DrugDetailsModal>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="wellcentra">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Drug Name</TableHead>
                          <TableHead>NDC</TableHead>
                          <TableHead>Lowest Price</TableHead>
                          <TableHead>WAC Price</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getPaginatedData().map((drug: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{drug.drugName}</TableCell>
                            <TableCell>
                              {drug.wellcentra && drug.wellcentra.length > 0
                                ? drug.wellcentra[0]["NDC"] || "N/A"
                                : "N/A"}
                              {drug.wellcentra && drug.wellcentra.length > 1 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (+{drug.wellcentra.length - 1} more)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatCurrency(drug.wellcentraPrice)}</TableCell>
                            <TableCell>
                              {drug.wellcentra && drug.wellcentra.length > 0
                                ? formatCurrency(drug.wellcentra[0]["WAC Price"])
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {drug.wellcentra && drug.wellcentra.length > 0
                                ? drug.wellcentra[0]["Source Column"] || "N/A"
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <DrugDetailsModal drug={drug}>
                                <Button variant="ghost" size="sm" className="h-8">
                                  <PlusCircleIcon className="h-4 w-4" />
                                </Button>
                              </DrugDetailsModal>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageToShow
                        if (totalPages <= 5) {
                          pageToShow = i + 1
                        } else if (currentPage <= 3) {
                          pageToShow = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageToShow = totalPages - 4 + i
                        } else {
                          pageToShow = currentPage - 2 + i
                        }

                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={currentPage === pageToShow}
                              onClick={() => setCurrentPage(pageToShow)}
                            >
                              {pageToShow}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(itemsPerPage, getFilteredAndSortedDrugs().length)} of{" "}
                  {getFilteredAndSortedDrugs().length} drugs
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {itemsPerPage}
                        <ChevronDownIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {[10, 20, 50, 100].map((value) => (
                        <DropdownMenuItem
                          key={value}
                          onClick={() => {
                            setItemsPerPage(value)
                            setCurrentPage(1) // Reset to first page when changing items per page
                          }}
                        >
                          {value}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={exportToExcel}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export Complete Analysis
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
