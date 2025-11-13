
import { differenceInYears } from 'date-fns'
export interface EligibilityInput {
  dob: string
  category: 'UR'|'SC'|'ST'|'OBC-NCL'|'EWS'|'PwBD'
  crucialDate: string
  ageMin?: number
  ageMax?: number
}
export function computeAgeOn(dateISO: string, dobISO: string){ return differenceInYears(new Date(dateISO), new Date(dobISO)) }
export function applyAgeRelaxation(baseMax: number, category: string){ let relax=0; if(category==='SC'||category==='ST') relax+=5; if(category==='OBC-NCL') relax+=3; return Math.min(baseMax+relax, 56) }
export function checkEligibility(input: EligibilityInput){ const age=computeAgeOn(input.crucialDate, input.dob); const max=input.ageMax?applyAgeRelaxation(input.ageMax,input.category):undefined; const ok=(input.ageMin?age>=input.ageMin:true)&& (max?age<=max:true); const notes:string[]=[]; if(!ok) notes.push(`Age ${age} outside limits ${input.ageMin||'-'} to ${max||'-'}`); return { age, ageOk: ok, notes } }
