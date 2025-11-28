export interface Recommendation {
  verdict: 'RENT' | 'BUY';
  savings: number; // Positive = how much renting saves, Negative = how much buying saves
  monthlyDifference: number; // Positive = buying costs more per month, Negative = renting costs more
  breakEvenMonth: number | null; // Month when buying becomes better, null if never
  breakEvenYear: number | null; // Year when buying becomes better (for display)
  confidence: 'high' | 'medium' | 'low'; // Based on timeline length
  reasoning: string; // One sentence explanation
}

export function generateRecommendation(
  analysisData: any,
  timelineYears: number
): Recommendation {
  // Normalize the data structure - handle both camelCase and snake_case
  const timeline = analysisData.timeline || [];
  if (!timeline || timeline.length === 0) {
    console.error('No timeline data in analysisData:', analysisData);
    return {
      verdict: 'RENT',
      savings: 0,
      monthlyDifference: 0,
      breakEvenMonth: null,
      breakEvenYear: null,
      confidence: 'low',
      reasoning: 'Unable to calculate recommendation - missing data.'
    };
  }
  
  // Extract final net worth difference (buying - renting)
  // Handle both camelCase and snake_case property names
  const finalTimelinePoint = timeline[timeline.length - 1];
  const netWorthBuy = finalTimelinePoint?.netWorthBuy ?? finalTimelinePoint?.net_worth_buy ?? 
                      finalTimelinePoint?.buyingNetWorth ?? finalTimelinePoint?.buyerNetWorth ?? 0;
  const netWorthRent = finalTimelinePoint?.netWorthRent ?? finalTimelinePoint?.net_worth_rent ?? 
                       finalTimelinePoint?.rentingNetWorth ?? finalTimelinePoint?.renterNetWorth ?? 0;
  
  // Validate values
  if (isNaN(netWorthBuy) || isNaN(netWorthRent)) {
    console.error('Invalid net worth values:', { netWorthBuy, netWorthRent, finalTimelinePoint });
    return {
      verdict: 'RENT',
      savings: 0,
      monthlyDifference: 0,
      breakEvenMonth: null,
      breakEvenYear: null,
      confidence: 'low',
      reasoning: 'Unable to calculate recommendation - invalid data.'
    };
  }
  
  const netWorthDifference = netWorthBuy - netWorthRent;
  
  // Extract break-even information from breakEven object
  const breakEven = analysisData.breakEven || analysisData.break_even || {};
  const breakEvenMonth = breakEven.monthIndex ?? breakEven.month_index ?? null;
  const breakEvenYear = breakEven.year ?? (breakEvenMonth ? Math.ceil(breakEvenMonth / 12) : null);
  
  // Calculate average monthly difference
  // Handle both camelCase and snake_case property names
  let totalMonthlyDiff = 0;
  let validPoints = 0;
  
  for (const point of timeline) {
    const buyOutflow = point?.buyMonthlyOutflow ?? point?.buy_monthly_outflow ?? 
                       point?.buyingMonthlyCost ?? point?.monthlyBuyingCosts ?? 0;
    const rentOutflow = point?.rentMonthlyOutflow ?? point?.rent_monthly_outflow ?? 
                        point?.rentingMonthlyCost ?? point?.monthlyRentingCosts ?? 0;
    
    if (!isNaN(buyOutflow) && !isNaN(rentOutflow) && buyOutflow !== 0 && rentOutflow !== 0) {
      totalMonthlyDiff += (buyOutflow - rentOutflow);
      validPoints++;
    }
  }
  
  const avgMonthlyDiff = validPoints > 0 ? totalMonthlyDiff / validPoints : 0;
  
  // Determine verdict
  const verdict: 'RENT' | 'BUY' = netWorthDifference > 0 ? 'BUY' : 'RENT';
  const savings = Math.abs(netWorthDifference);
  
  // Determine confidence based on timeline
  let confidence: 'high' | 'medium' | 'low';
  if (timelineYears >= 10) {
    confidence = 'high';
  } else if (timelineYears >= 5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Generate reasoning
  let reasoning = '';
  if (verdict === 'RENT') {
    if (breakEvenYear && breakEvenYear > timelineYears) {
      reasoning = `Renting is better because you break even in year ${breakEvenYear}, but you're only staying ${timelineYears} years.`;
    } else if (!breakEvenYear) {
      reasoning = `Renting is better because buying never becomes financially advantageous in this market.`;
    } else {
      reasoning = `Renting leaves you with more money over ${timelineYears} years because you're investing the difference.`;
    }
  } else {
    if (breakEvenYear && breakEvenYear <= timelineYears) {
      reasoning = `Buying is better because you break even in year ${breakEvenYear} and you're staying ${timelineYears} years.`;
    } else {
      reasoning = `Buying builds equity faster than renting costs over ${timelineYears} years in this market.`;
    }
  }
  
  return {
    verdict,
    savings,
    monthlyDifference: avgMonthlyDiff,
    breakEvenMonth,
    breakEvenYear,
    confidence,
    reasoning
  };
}

