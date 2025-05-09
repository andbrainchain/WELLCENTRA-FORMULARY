// This is the core processing logic for the formulary data

export function processFormularies(teamstersData: any[], wellcentraData: any[]) {
  // Add source information to each dataset and filter out $0 prices
  const processedTeamstersData = teamstersData
    .filter((item) => item && item["TOTAL COST"] && Number.parseFloat(item["TOTAL COST"]) > 0)
    .map((item) => ({
      ...item,
      Source: "Teamsters",
    }))

  const processedWellcentraData = wellcentraData
    .filter((item) => item && item["Lowest Price"] && Number.parseFloat(item["Lowest Price"]) > 0)
    .map((item) => ({
      ...item,
      Source: "Wellcentra",
    }))

  // Merge the datasets
  const mergedData = [...processedTeamstersData, ...processedWellcentraData]

  // Group drugs by name for aggregation and comparison
  const drugGroups = new Map()

  // First, group all drugs by their name
  mergedData.forEach((item) => {
    if (!item || !item["Drug Name"]) return // Skip invalid items

    const drugName = item["Drug Name"]
    if (!drugGroups.has(drugName)) {
      drugGroups.set(drugName, {
        drugName,
        teamsters: [],
        wellcentra: [],
      })
    }

    const group = drugGroups.get(drugName)
    if (item.Source === "Teamsters") {
      group.teamsters.push(item)
    } else {
      group.wellcentra.push(item)
    }
  })

  // Convert the map to an array for easier processing
  const allDrugsGrouped = Array.from(drugGroups.values())

  // Calculate savings for each drug group
  const drugsWithSavings = allDrugsGrouped.map((group) => {
    // Default values
    let hasMatch = false
    let teamstersCost = 0
    let wellcentraPrice = 0
    let patientSavings = 0
    let planSavings = 0
    let totalSavings = 0
    let savingsPercent = 0
    let patientSavingsPercent = 0
    let planSavingsPercent = 0

    // If we have both Teamsters and Wellcentra data for this drug
    if (group.teamsters && group.wellcentra && group.teamsters.length > 0 && group.wellcentra.length > 0) {
      hasMatch = true

      // Use the first entry for basic calculations (we'll store all variants)
      const teamstersDrug = group.teamsters[0]
      const wellcentraDrug = group.wellcentra[0]

      // Safely access properties with fallbacks
      teamstersCost = teamstersDrug && teamstersDrug["TOTAL COST"] ? Number.parseFloat(teamstersDrug["TOTAL COST"]) : 0

      wellcentraPrice =
        wellcentraDrug && wellcentraDrug["Lowest Price"] ? Number.parseFloat(wellcentraDrug["Lowest Price"]) : 0

      // Calculate total savings
      totalSavings = teamstersCost - wellcentraPrice
      savingsPercent = teamstersCost > 0 ? (totalSavings / teamstersCost) * 100 : 0

      // Calculate patient and plan savings
      // Assuming patient pays 20% and plan pays 80% (adjust as needed)
      const patientShare = 0.2
      const planShare = 0.8

      patientSavings = totalSavings * patientShare
      planSavings = totalSavings * planShare

      patientSavingsPercent = savingsPercent * patientShare
      planSavingsPercent = savingsPercent * planShare
    }

    return {
      ...group,
      hasMatch,
      teamstersCost: teamstersCost.toFixed(2),
      wellcentraPrice: wellcentraPrice.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      savingsPercent: savingsPercent.toFixed(2),
      patientSavings: patientSavings.toFixed(2),
      planSavings: planSavings.toFixed(2),
      patientSavingsPercent: patientSavingsPercent.toFixed(2),
      planSavingsPercent: planSavingsPercent.toFixed(2),
    }
  })

  // Calculate summary statistics
  const matchedDrugs = drugsWithSavings.filter((drug) => drug.hasMatch)
  const totalTeamstersCost = matchedDrugs.reduce((sum, drug) => sum + Number.parseFloat(drug.teamstersCost), 0)
  const totalWellcentraPrice = matchedDrugs.reduce((sum, drug) => sum + Number.parseFloat(drug.wellcentraPrice), 0)
  const totalSavings = matchedDrugs.reduce((sum, drug) => sum + Number.parseFloat(drug.totalSavings), 0)
  const totalPatientSavings = matchedDrugs.reduce((sum, drug) => sum + Number.parseFloat(drug.patientSavings), 0)
  const totalPlanSavings = matchedDrugs.reduce((sum, drug) => sum + Number.parseFloat(drug.planSavings), 0)

  const overallSavingsPercent = totalTeamstersCost > 0 ? (totalSavings / totalTeamstersCost) * 100 : 0

  return {
    allDrugs: mergedData,
    drugsWithSavings,
    summary: {
      totalDrugs: drugGroups.size,
      matchedDrugs: matchedDrugs.length,
      teamstersOnly: allDrugsGrouped.filter((g) => g.teamsters.length > 0 && g.wellcentra.length === 0).length,
      wellcentraOnly: allDrugsGrouped.filter((g) => g.teamsters.length === 0 && g.wellcentra.length > 0).length,
      totalTeamstersCost,
      totalWellcentraPrice,
      totalSavings,
      totalPatientSavings,
      totalPlanSavings,
      overallSavingsPercent,
    },
  }
}
