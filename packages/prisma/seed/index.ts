
import { PrismaClient, JobCategory } from '@prisma/client'
const prisma = new PrismaClient()
async function main(){
  const lab = await prisma.lab.upsert({ where: { code:'SERC' }, update: {}, create: { code:'SERC', name:'CSIR-Structural Engineering Research Centre' } })
  const dept = await prisma.department.upsert({ where: { code:'ADM' }, update: {}, create: { code:'ADM', name:'Administration' } })
  await prisma.user.upsert({ where: { email:'admin@serc.res.in' }, update: {}, create: { email:'admin@serc.res.in', password:'$2b$10$2b2b2b2b2b2b2b2b2b2bOOwqS8YQ0Y9rS7E4v6rKp1w0FZb3H2y', name:'Portal Admin', role:'ADMIN' } })
  for(const type of [JobCategory.TECHNICIAN, JobCategory.TECHNICAL_ASSISTANT, JobCategory.TECHNICAL_OFFICER, JobCategory.SCIENTIST]){
    await prisma.formDefinition.create({ data: { name: `${type} v1`, type, steps: { steps: [
      { key:'personal', title:'Personal Details', fields:[ { id:'fullName', type:'text', label:'Full Name', required:true }, { id:'dob', type:'date', label:'Date of Birth', required:true }, { id:'category', type:'select', label:'Reservation Category', options:['UR','SC','ST','OBC-NCL','EWS','PwBD'], required:true } ] },
      { key:'education', title:'Education', fields:[ { id:'highestQual', type:'text', label:'Highest Qualification', required:true }, { id:'marks', type:'number', label:'Percentage/CGPA', required:true } ] },
      { key:'experience', title:'Experience', fields:[ { id:'years', type:'number', label:'Years of Experience' } ] },
      { key:'documents', title:'Documents', fields:[ { id:'photo', type:'file', label:'Photo', accept:'image/*', required:true }, { id:'signature', type:'file', label:'Signature', accept:'image/*', required:true }, { id:'categoryCert', type:'file', label:'Category Certificate', accept:'application/pdf,image/*' } ] }
    ] }, requiredDocs: ['PHOTO','SIGNATURE','ID_PROOF'] } })
  }
  await prisma.jobPost.create({ data: { code:'SERC/TECH/2025-11-11-001', title:'Technician (Fitter)', category:'TECHNICIAN', labId:lab.id, departmentId:dept.id, status:'OPEN', openDate:new Date('2025-11-01'), closeDate:new Date('2025-12-01'), crucialDate:new Date('2025-12-01'), description:'Trade Test + Written Test', reservationJson:{ UR:2, OBCNCL:1, SC:1, ST:0, EWS:1 }, qualsJson:{ essential:['ITI in relevant trade'] } } })
  console.log('Seed completed')
}
main().finally(()=>prisma.$disconnect())
