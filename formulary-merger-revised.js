import xlsx from 'xlsx';

async function mergeFormularies() {
  console.log("Starting pharmacy formulary merger and analysis...");
  
  try {
    // In a production environment, you would fetch data from Google Sheets API
    // For demonstration, I'll create sample data based on the screenshots
    
    // Sample data from Teamsters spreadsheet (first screenshot)
    const teamstersData = [
      {
        "Carrier": "94KB",
        "Carrier Name": "TEAMSTERS LOCAL",
        "Contract": "94KBTLP2",
        "Group": "94KBPLN2ACT",
        "Group Name": "LOCAL 830 PLAN 2 ACTIVE",
        "BIN": "017772",
        "Drug Name": "TALTZ AUTOINJECTOR",
        "Generic Name": "TALTZ 80 MG/ML",
        "NDC": "00002-7339-11",
        "Pharmacy RX": "0000000178993",
        "TOTAL COST": 6800.25, // Example value
        "AWP": 7482.60, // Example AWP value
        "Source": "Teamsters"
      },
      {
        "Carrier": "94KB",
        "Carrier Name": "TEAMSTERS LOCAL",
        "Contract": "94KBTLP3",
        "Group": "94KBPLN3RDS",
        "Group Name": "LOCAL 830 PLAN 3 RDS",
        "BIN": "017772",
        "Drug Name": "HUMIRA(CF) PEN",
        "Generic Name": "HUMIRA(CF) PEN 40MG/0.4ML",
        "NDC": "00074-2540-02",
        "Pharmacy RX": "0000000487858",
        "TOTAL COST": 5950.75, // Example value
        "AWP": 7037.76, // Example AWP value
        "Source": "Teamsters"
      },
      {
        "Carrier": "94KB",
        "Carrier Name": "TEAMSTERS LOCAL",
        "Contract": "94KBTLP2",
        "Group": "94KBPLN2ACT",
        "Group Name": "LOCAL 830 PLAN 2 ACTIVE",
        "BIN": "017772",
        "Drug Name": "ENBREL",
        "Generic Name": "ENBREL 50 MG/ML",
        "NDC": "58406-435-01",
        "Pharmacy RX": "0000000516378",
        "TOTAL COST": 5890.50, // Example value
        "AWP": 6947.69, // Example AWP value
        "Source": "Teamsters"
      },
      {
        "Carrier": "94KB",
        "Carrier Name": "TEAMSTERS LOCAL",
        "Contract": "94KBTLP2",
        "Group": "94KBPLN2ACT",
        "Group Name": "LOCAL 830 PLAN 2 ACTIVE",
        "BIN": "017772",
        "Drug Name": "BENLYSTA",
        "Generic Name": "BENLYSTA 200 MG/ML",
        "NDC": "49401-088-01",
        "Pharmacy RX": "0000000474543",
        "TOTAL COST": 4950.25, // Example value
        "AWP": 5940.30, // Example AWP value
        "Source": "Teamsters"
      }
    ];
    
    // Sample data from Wellcentra spreadsheet (second screenshot)
    const wellcentraData = [
      {
        "Drug Name": "ABIRATERONE ACETATE 250 MG TAB",
        "NDC": "N/A",
        "WAC Price": 3412.26,
        "Lowest Price": 144.64,
        "Source Column": "GERMANY",
        "AWP": 4094.71, // Example AWP value
        "Source": "Wellcentra"
      },
      {
        "Drug Name": "Actemra (tocilizumab)",
        "NDC": "N/A",
        "WAC Price": null,
        "Lowest Price": 544.23,
        "Source Column": "Australia",
        "AWP": 652.80, // Example AWP value
        "Source": "Wellcentra"
      },
      {
        "Drug Name": "Actemra (tocilizumab) 162 x 4",
        "NDC": "N/A",
        "WAC Price": 1145.56,
        "Lowest Price": 967.87,
        "Source Column": "CANADA",
        "AWP": 1374.67, // Example AWP value
        "Source": "Wellcentra"
      },
      {
        "Drug Name": "HUMIRA(CF) PEN",
        "NDC": "00074-2540-02",
        "WAC Price": 5864.80,
        "Lowest Price": 3128.33,
        "Source Column": "CANADA",
        "AWP": 7037.76, // Example AWP value
        "Source": "Wellcentra"
      },
      {
        "Drug Name": "ENBREL",
        "NDC": "58406-435-01",
        "WAC Price": 5789.74,
        "Lowest Price": 2167.84,
        "Source Column": "GERMANY",
        "AWP": 6947.69, // Example AWP value
        "Source": "Wellcentra"
      },
      {
        "Drug Name": "BENLYSTA",
        "NDC": "N/A",
        "WAC Price": 4842.5,
        "Lowest Price": 1116.48,
        "Source Column": "DENMARK",
        "AWP": 5811.00, // Example AWP value
        "Source": "Wellcentra"
      },
      {
        "Drug Name": "TALTZ AUTOINJECTOR",
        "NDC": "00002-7339-11",
        "WAC Price": 6235.50,
        "Lowest Price": 2179.32,
        "Source Column": "GERMANY",
        "AWP": 7482.60, // Example AWP value
        "Source": "Wellcentra"
      }
    ];
    
    // Merge the datasets
    const mergedData = [...teamstersData, ...wellcentraData];
    
    // Sort by drug name
    mergedData.sort((a, b) => a["Drug Name"].localeCompare(b["Drug Name"]));
    
    console.log("\n=== MERGED FORMULARY (Sample) ===");
    console.table(mergedData.slice(0, 3)); // Show first 3 entries for brevity
    
    // Group by drug name for comparison
    const drugNameMap = new Map();
    const ndcMatches = [];
    
    mergedData.forEach(item => {
      const drugName = item["Drug Name"];
      if (!drugNameMap.has(drugName)) {
        drugNameMap.set(drugName, []);
      }
      drugNameMap.get(drugName).push(item);
      
      // Check for NDC matches
      if (item["NDC"] && item["NDC"] !== "N/A") {
        mergedData.forEach(compareItem => {
          if (item !== compareItem && 
              compareItem["NDC"] && 
              compareItem["NDC"] !== "N/A" && 
              item["NDC"] === compareItem["NDC"]) {
            
            // Check if this match is already recorded
            const matchExists = ndcMatches.some(match => 
              match.NDC === item["NDC"] && 
              match.Sources.includes(item.Source) && 
              match.Sources.includes(compareItem.Source)
            );
            
            if (!matchExists) {
              ndcMatches.push({
                NDC: item["NDC"],
                "Drug Name": item["Drug Name"],
                Sources: `${item.Source} and ${compareItem.Source}`
              });
            }
          }
        });
      }
    });
    
    // Analyze cost differences for matching drugs
    console.log("\n=== COST ANALYSIS ===");
    const costAnalysis = [];
    let totalSavings = 0;
    let comparisonCount = 0;
    
    for (const [drugName, items] of drugNameMap.entries()) {
      if (items.length > 1) {
        // Find Teamsters and Wellcentra items
        const teamsters = items.find(item => item.Source === "Teamsters");
        const wellcentra = items.find(item => item.Source === "Wellcentra");
        
        if (teamsters && wellcentra) {
          comparisonCount++;
          
          // Compare "TOTAL COST" vs "Lowest Price"
          const priceDiff = teamsters["TOTAL COST"] - wellcentra["Lowest Price"];
          const percentageSavings = (priceDiff / teamsters["TOTAL COST"]) * 100;
          
          // Compare "WAC Price" vs "AWP" as requested
          let wacAwpComparison = "N/A";
          let wacAwpPercentage = "N/A";
          
          if (wellcentra["WAC Price"] && wellcentra["AWP"]) {
            const wacAwpDiff = wellcentra["WAC Price"] - wellcentra["AWP"];
            const wacAwpSavings = (wacAwpDiff / wellcentra["WAC Price"]) * 100;
            wacAwpComparison = wacAwpDiff.toFixed(2);
            wacAwpPercentage = wacAwpSavings.toFixed(2) + "%";
          }
          
          costAnalysis.push({
            "Drug Name": drugName,
            "Generic Name": teamsters["Generic Name"] || "N/A",
            "NDC Match": teamsters["NDC"] === wellcentra["NDC"] ? "YES" : "NO",
            "Teamsters TOTAL COST": teamsters["TOTAL COST"].toFixed(2),
            "Wellcentra Lowest Price": wellcentra["Lowest Price"].toFixed(2),
            "Price Savings": priceDiff.toFixed(2),
            "Savings %": percentageSavings.toFixed(2) + "%",
            "WAC Price": wellcentra["WAC Price"] ? wellcentra["WAC Price"].toFixed(2) : "N/A",
            "AWP": wellcentra["AWP"] ? wellcentra["AWP"].toFixed(2) : "N/A",
            "WAC vs AWP Diff": wacAwpComparison,
            "WAC vs AWP %": wacAwpPercentage,
            "Source Country": wellcentra["Source Column"]
          });
          
          totalSavings += priceDiff;
        }
      }
    }
    
    console.table(costAnalysis);
    
    // High-level drug name matching (ignoring dosage)
    const highLevelMatches = new Map();
    
    mergedData.forEach(item => {
      // Extract base drug name (before any spaces, parentheses, or numbers)
      let baseDrugName = item["Drug Name"]
        .split(/\s|\(|\d/)[0]  // Split on spaces, opening parentheses, or numbers
        .toUpperCase()
        .trim();
      
      // Handle special cases like HUMIRA(CF)
      if (item["Drug Name"].toUpperCase().includes("HUMIRA")) {
        baseDrugName = "HUMIRA";
      }
      
      if (!highLevelMatches.has(baseDrugName)) {
        highLevelMatches.set(baseDrugName, {
          count: 0,
          sources: new Set(),
          examples: []
        });
      }
      
      const match = highLevelMatches.get(baseDrugName);
      match.count++;
      match.sources.add(item.Source);
      if (match.examples.length < 2 || 
          (match.examples.length < 3 && !match.examples.some(ex => ex.Source === item.Source))) {
        match.examples.push({
          "Full Name": item["Drug Name"],
          "Source": item.Source,
          "Price": item.Source === "Teamsters" ? item["TOTAL COST"] : item["Lowest Price"],
          "WAC": item["WAC Price"],
          "AWP": item["AWP"]
        });
      }
    });
    
    // Filter to only show high-level matches that appear in both sources
    const crossSourceMatches = Array.from(highLevelMatches.entries())
      .filter(([_, data]) => data.sources.size > 1)
      .map(([name, data]) => {
        const teamstersExample = data.examples.find(ex => ex.Source === "Teamsters");
        const wellcentraExample = data.examples.find(ex => ex.Source === "Wellcentra");
        
        let savingsInfo = "N/A";
        let savingsPercent = "N/A";
        let wacAwpDiff = "N/A";
        
        if (teamstersExample && wellcentraExample) {
          const savings = teamstersExample.Price - wellcentraExample.Price;
          const percent = (savings / teamstersExample.Price) * 100;
          savingsInfo = savings.toFixed(2);
          savingsPercent = percent.toFixed(2) + "%";
          
          if (wellcentraExample.WAC && wellcentraExample.AWP) {
            wacAwpDiff = (wellcentraExample.WAC - wellcentraExample.AWP).toFixed(2);
          }
        }
        
        return {
          "Base Drug Name": name,
          "Total Occurrences": data.count,
          "Teamsters Example": teamstersExample?.["Full Name"] || "N/A",
          "Teamsters Price": teamstersExample?.Price.toFixed(2) || "N/A",
          "Wellcentra Example": wellcentraExample?.["Full Name"] || "N/A",
          "Wellcentra Price": wellcentraExample?.Price.toFixed(2) || "N/A",
          "Potential Savings": savingsInfo,
          "Savings %": savingsPercent,
          "WAC Price": wellcentraExample?.WAC?.toFixed(2) || "N/A",
          "AWP": wellcentraExample?.AWP?.toFixed(2) || "N/A",
          "WAC vs AWP Diff": wacAwpDiff
        };
      })
      .sort((a, b) => {
        // Sort by savings percentage (descending)
        const aPercent = parseFloat(a["Savings %"]) || 0;
        const bPercent = parseFloat(b["Savings %"]) || 0;
        return bPercent - aPercent;
      });
    
    console.log("\n=== HIGH-LEVEL DRUG NAME MATCHES (Across Sources) ===");
    console.table(crossSourceMatches);
    
    // NDC matches
    if (ndcMatches.length > 0) {
      console.log("\n=== NDC MATCHES ===");
      console.table(ndcMatches);
    } else {
      console.log("\nNo exact NDC matches found between spreadsheets.");
    }
    
    // WAC vs AWP Analysis
    console.log("\n=== WAC PRICE vs AWP ANALYSIS ===");
    const wacAwpAnalysis = [];
    
    for (const item of mergedData) {
      if (item["WAC Price"] && item["AWP"] && item.Source === "Wellcentra") {
        const diff = item["WAC Price"] - item["AWP"];
        const percentDiff = (diff / item["WAC Price"]) * 100;
        
        wacAwpAnalysis.push({
          "Drug Name": item["Drug Name"],
          "WAC Price": item["WAC Price"].toFixed(2),
          "AWP": item["AWP"].toFixed(2),
          "Difference": diff.toFixed(2),
          "Difference %": percentDiff.toFixed(2) + "%",
          "Source Country": item["Source Column"]
        });
      }
    }
    
    // Sort by difference percentage (largest first)
    wacAwpAnalysis.sort((a, b) => {
      return parseFloat(b["Difference %"]) - parseFloat(a["Difference %"]);
    });
    
    console.table(wacAwpAnalysis);
    
    // Summary statistics
    console.log("\n=== SUMMARY STATISTICS ===");
    console.log(`Total unique drugs in formulary: ${drugNameMap.size}`);
    console.log(`Number of drugs with exact name matches: ${comparisonCount}`);
    console.log(`Number of drugs with high-level name matches: ${crossSourceMatches.length}`);
    console.log(`Total potential savings with Wellcentra: $${totalSavings.toFixed(2)}`);
    
    if (comparisonCount > 0) {
      console.log(`Average savings per drug: $${(totalSavings / comparisonCount).toFixed(2)}`);
      console.log(`Average savings percentage: ${(costAnalysis.reduce((sum, item) => sum + parseFloat(item["Savings %"]), 0) / comparisonCount).toFixed(2)}%`);
    }
    
    console.log(`NDC exact matches: ${ndcMatches.length}`);
    
    // WAC vs AWP summary
    if (wacAwpAnalysis.length > 0) {
      const avgWacAwpDiff = wacAwpAnalysis.reduce((sum, item) => sum + parseFloat(item["Difference %"]), 0) / wacAwpAnalysis.length;
      console.log(`Average WAC vs AWP difference: ${avgWacAwpDiff.toFixed(2)}%`);
    }
    
    // Sales insights
    console.log("\n=== SALES INSIGHTS FOR WELLCENTRA ===");
    
    // 1. Overall savings potential
    if (comparisonCount > 0) {
      const avgSavingsPercent = (costAnalysis.reduce((sum, item) => sum + parseFloat(item["Savings %"]), 0) / comparisonCount).toFixed(2);
      console.log(`1. COST SAVINGS POTENTIAL:`);
      console.log(`   - Wellcentra pricing shows an average savings of ${avgSavingsPercent}% compared to Teamsters pricing.`);
      console.log(`   - For the analyzed medications, this represents a total savings of $${totalSavings.toFixed(2)}.`);
      
      // 2. Top savings medications
      const topSavings = [...costAnalysis].sort((a, b) => parseFloat(b["Price Savings"]) - parseFloat(a["Price Savings"])).slice(0, 3);
      
      console.log("\n2. TOP SAVINGS OPPORTUNITIES:");
      topSavings.forEach((drug, index) => {
        console.log(`   ${index + 1}. ${drug["Drug Name"]}: $${drug["Price Savings"]} (${drug["Savings %"]} savings)`);
      });
      
      // 3. WAC vs AWP Analysis
      if (wacAwpAnalysis.length > 0) {
        console.log("\n3. WAC PRICE vs AWP ANALYSIS:");
        console.log(`   - Average difference between WAC Price and AWP: ${avgWacAwpDiff.toFixed(2)}%`);
        
        // Top WAC vs AWP differences
        const topWacAwpDiffs = wacAwpAnalysis.slice(0, 3);
        console.log(`   - Top medications with largest WAC vs AWP differences:`);
        topWacAwpDiffs.forEach((drug, index) => {
          console.log(`     ${index + 1}. ${drug["Drug Name"]}: ${drug["Difference %"]} difference (WAC: $${drug["WAC Price"]}, AWP: $${drug["AWP"]})`);
        });
      }
      
      // 4. International sourcing advantage
      const sourceCountries = new Set(costAnalysis.map(item => item["Source Country"]));
      console.log("\n4. INTERNATIONAL SOURCING ADVANTAGE:");
      console.log(`   - Wellcentra leverages ${sourceCountries.size} international sources (${Array.from(sourceCountries).join(", ")}) to provide competitive pricing.`);
    }
    
    // 5. Formulary coverage
    console.log("\n5. FORMULARY COVERAGE:");
    console.log(`   - ${crossSourceMatches.length} medications have matching entries across both formularies.`);
    console.log(`   - This represents ${((crossSourceMatches.length / drugNameMap.size) * 100).toFixed(2)}% of the total unique medications.`);
    
    // 6. NDC matching
    console.log("\n6. NDC CODE MATCHING:");
    console.log(`   - ${ndcMatches.length} medications have exact NDC code matches between Teamsters and Wellcentra.`);
    if (ndcMatches.length > 0) {
      console.log(`   - These exact matches ensure seamless substitution without formulary disruption.`);
    }
    
    console.log("\nFormulary analysis completed successfully!");
    
    // In a real scenario, you would export to Excel:
    // const workbook = xlsx.utils.book_new();
    
    // Merged formulary sheet
    // const mergedSheet = xlsx.utils.json_to_sheet(mergedData);
    // xlsx.utils.book_append_sheet(workbook, mergedSheet, "Merged Formulary");
    
    // Cost analysis sheet
    // const analysisSheet = xlsx.utils.json_to_sheet(costAnalysis);
    // xlsx.utils.book_append_sheet(workbook, analysisSheet, "Cost Analysis");
    
    // WAC vs AWP analysis sheet
    // const wacAwpSheet = xlsx.utils.json_to_sheet(wacAwpAnalysis);
    // xlsx.utils.book_append_sheet(workbook, wacAwpSheet, "WAC vs AWP Analysis");
    
    // High-level matches sheet
    // const matchesSheet = xlsx.utils.json_to_sheet(crossSourceMatches);
    // xlsx.utils.book_append_sheet(workbook, matchesSheet, "Drug Name Matches");
    
    // NDC matches sheet
    // if (ndcMatches.length > 0) {
    //   const ndcSheet = xlsx.utils.json_to_sheet(ndcMatches);
    //   xlsx.utils.book_append_sheet(workbook, ndcSheet, "NDC Matches");
    // }
    
    // xlsx.writeFile(workbook, "wellcentra_teamsters_formulary_analysis.xlsx");
    
  } catch (error) {
    console.error("Error processing formulary data:", error);
  }
}

mergeFormularies();
