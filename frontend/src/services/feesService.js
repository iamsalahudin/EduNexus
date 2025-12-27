// Mock fees API service
function wait(ms){ return new Promise(r=>setTimeout(r, ms)) }

export async function fetchFeesSummary(){
  await wait(300)
  return {
    totalStudents: 1200,
    paidThisMonth: 980,
    pendingCount: 45,
    totalCollected: 125000
  }
}

export async function fetchFeeDefaulters(filters = {}){
  await wait(350)
  // return mock list filtered superficially
  const rows = Array.from({length:12}).map((_,i)=>({
    id: 1000+i,
    roll: `R-${1000+i}`,
    name: `Student ${i+1}`,
    father: `Father ${i+1}`,
    class: `Class ${((i%5)+1)}`,
    section: ['A','B','C'][i%3],
    gender: i%2? 'Male' : 'Female',
    feeType: i%2? 'Tuition' : 'Transport',
    pendingFee: (Math.floor(Math.random()*5000)+1000)
  }))
  return rows
}

export async function fetchFeeRecords(filters = {}){
  await wait(300)
  const rows = Array.from({length:15}).map((_,i)=>({
    id: 2000+i,
    roll: `R-${2000+i}`,
    name: `Student ${i+1}`,
    father: `Father ${i+1}`,
    class: `Class ${((i%6)+1)}`,
    section: ['A','B','C'][i%3],
    gender: i%2? 'Male' : 'Female',
    lastPaymentDate: `2025-0${(i%9)+1}-15`,
    monthlyFee: 5000
  }))
  return rows
}

export async function fetchFeeDetails(id){
  await wait(200)
  return {
    student: { roll: `R-${id}`, name: `Student ${id}`, father: 'Father X', class: 'Class 3', section: 'A', gender: 'Male'},
    feeInfo: { monthlyFee: 5000, lastPaymentDate: '2025-11-15', concession: '0%', transport: 'Yes' },
    transactions: Array.from({length:6}).map((_,i)=>({
      voucherDate: `2025-0${(i%9)+1}-05`, voucherNo: `V-${id}-${i}`, dueDate: `2025-0${(i%9)+1}-20`, feeType: 'Tuition', totalFee: 5000, status: ['Paid','Pending'][i%2], paymentDate: i%2? `2025-0${(i%9)+1}-18` : null
    }))
  }
}

export async function fetchFeeStructure(){
  await wait(200)
  return {
    regularFees: [
      {label:'Annual', amount:500},
      {label:'Admission', amount:1000}
    ],
    tuition: {
      type:'Monthly', levels: {
        'Pre-Primary':2000,
        'Primary':3000,
        'Middle':4000
      }
    }
  }
}
