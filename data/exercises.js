// Exercise library. unit = unit of the number you load (Jett machine stacks are in lb).
// perSide = weight is per dumbbell / per side. inc = normal jump for that equipment.
// kind: weight | bw (bodyweight, weight = added load) | time (seconds) | cardio (minutes)
const E = (id, o) => ({ id, unit: 'kg', inc: 2.5, perSide: false, kind: 'weight', secondary: [], alts: [], cues: [], mistakes: [], ...o });

export const EXERCISES = [
  // ---------------- chest / push
  E('benchPress', { name: 'Barbell Bench Press', th: 'เบนช์เพรสบาร์เบล', motion: 'benchPress', eq: 'barbell', primary: ['chest'], secondary: ['frontDelts', 'triceps'],
    cues: ['บีบสะบักเข้าหากันและกดลงก่อนยก — ไหล่ปลอดภัยกว่า', 'บาร์ลงแตะอกส่วนล่าง ข้อศอกทำมุม ~45–70° กับลำตัว', 'เท้ากดพื้นตลอด ดันบาร์ขึ้นเป็นเส้นโค้งไปเหนือไหล่'],
    mistakes: ['กางศอก 90° — ไหล่รับแรงเกิน', 'เด้งบาร์จากอก', 'ก้นลอยจากม้านั่ง'], alts: ['dbBench', 'smithBench'] }),
  E('smithBench', { name: 'Smith Machine Bench', th: 'เบนช์สมิธ', motion: 'benchPress', eq: 'machine', primary: ['chest'], secondary: ['frontDelts', 'triceps'],
    cues: ['จัดม้านั่งให้บาร์ลงตรงอกล่าง', 'บีบสะบักเหมือนบาร์เบล'], mistakes: ['ม้านั่งผิดตำแหน่ง บาร์ลงคอ'], alts: ['benchPress', 'dbBench'] }),
  E('dbBench', { name: 'Dumbbell Bench Press', th: 'ดัมเบลเบนช์', motion: 'dbBench', eq: 'dumbbell', perSide: true, inc: 2, primary: ['chest'], secondary: ['frontDelts', 'triceps'],
    cues: ['ลงลึกกว่าบาร์เบลได้ ให้อกยืดสุด', 'ดันขึ้นแล้วดัมเบลเข้าหากันเล็กน้อย', 'คุมช่วงลง 2 วินาที'],
    mistakes: ['ดัมเบลกระแทกกันข้างบน', 'ลงตื้นเพราะหนักเกิน'], alts: ['benchPress', 'smithBench'] }),
  E('inclineDbPress', { name: 'Incline Dumbbell Press', th: 'อินไคลน์ดัมเบลเพรส', motion: 'inclinePress', eq: 'dumbbell', perSide: true, inc: 2, primary: ['chest', 'frontDelts'], secondary: ['triceps'],
    cues: ['ปรับพนัก 30° พอ — สูงกว่านี้กลายเป็นท่าไหล่', 'ศอกอยู่ใต้ข้อมือตลอด', 'ลงถึงระดับอกบน'], mistakes: ['พนักชันเกิน', 'หลังแอ่นยกก้น'], alts: ['dbBench'] }),
  E('pecDeck', { name: 'Pec Deck', th: 'เพ็กเด็ค', motion: 'fly', eq: 'machine', unit: 'lb', inc: 5, primary: ['chest'], secondary: ['frontDelts'],
    cues: ['ปรับเบาะให้มือจับอยู่ระดับอก', 'บีบอกค้าง 1 วินาทีตรงกลาง', 'ปล่อยกลับช้าจนอกยืด'], mistakes: ['ใช้แขนดึงแทนอก', 'ไหล่ห่อไปข้างหน้า'], alts: ['cableFly'] }),
  E('cableFly', { name: 'Cable Fly', th: 'เคเบิลฟลาย', motion: 'fly', eq: 'cable', unit: 'lb', inc: 5, primary: ['chest'], secondary: ['frontDelts'],
    cues: ['ศอกงอเล็กน้อยค้างไว้ทั้งเซ็ต', 'เหมือนกอดต้นไม้ใหญ่'], mistakes: ['งอ-เหยียดศอกจนกลายเป็นท่าดัน'], alts: ['pecDeck'] }),
  E('dip', { name: 'Chest Dip', th: 'ดิป', motion: 'dip', eq: 'bodyweight', kind: 'bw', primary: ['chest', 'triceps'], secondary: ['frontDelts'],
    cues: ['เอนตัวไปข้างหน้าเล็กน้อยเพื่อเน้นอก', 'ลงจนต้นแขนขนานพื้น ไม่ต้องลึกกว่านั้น'], mistakes: ['ลงลึกเกินจนไหล่หน้าตึง', 'เหวี่ยงขา'], alts: ['dbBench'] }),

  // ---------------- shoulders
  E('seatedDbPress', { name: 'Seated Dumbbell Shoulder Press', th: 'ดัมเบลชอลเดอร์เพรส', motion: 'shoulderPress', eq: 'dumbbell', perSide: true, inc: 2, primary: ['frontDelts', 'sideDelts'], secondary: ['triceps'],
    cues: ['หลังแนบพนัก ไม่แอ่นหลังส่งน้ำหนัก', 'ลงจนดัมเบลถึงระดับหู', 'ดันขึ้นตรง ไม่ต้องให้ดัมเบลชนกัน'], mistakes: ['แอ่นหลังเป็นท่าอกบน', 'ลงตื้น'], alts: ['arnoldPress', 'machineShoulderPress'] }),
  E('arnoldPress', { name: 'Arnold Press', th: 'อาร์โนลด์เพรส', motion: 'arnoldPress', eq: 'dumbbell', perSide: true, inc: 2, primary: ['frontDelts', 'sideDelts'], secondary: ['triceps'],
    cues: ['เริ่มฝ่ามือหันเข้าหน้า หมุนออกระหว่างดันขึ้น', 'จังหวะช้า คุมตลอดทาง'], mistakes: ['หมุนเร็วจนกลายเป็นเหวี่ยง'], alts: ['seatedDbPress'] }),
  E('machineShoulderPress', { name: 'Machine Shoulder Press', th: 'เครื่องดันไหล่', motion: 'shoulderPress', eq: 'machine', unit: 'lb', inc: 5, primary: ['frontDelts', 'sideDelts'], secondary: ['triceps'],
    cues: ['ปรับเบาะให้มือจับอยู่ระดับไหล่'], mistakes: ['ยกก้นจากเบาะ'], alts: ['seatedDbPress'] }),
  E('lateralRaise', { name: 'Dumbbell Lateral Raise', th: 'ยกดัมเบลด้านข้าง', motion: 'lateralRaise', eq: 'dumbbell', perSide: true, inc: 1, primary: ['sideDelts'], secondary: ['traps'],
    cues: ['นำด้วยศอก ไม่ใช่มือ', 'ยกถึงระดับไหล่พอ', 'ลงช้า 2–3 วินาที'], mistakes: ['เหวี่ยงตัวส่ง', 'ยักไหล่ขึ้น (กลายเป็นบ่า)'], alts: ['cableLateralRaise'] }),
  E('cableLateralRaise', { name: 'Cable Lateral Raise', th: 'เคเบิลยกข้าง', motion: 'lateralRaise', eq: 'cable', unit: 'lb', inc: 2.5, primary: ['sideDelts'], secondary: ['traps'],
    cues: ['ยืนตะแคงข้างเครื่อง ทำทีละข้าง', 'แรงตึงคงที่ตลอดทางกว่าดัมเบล'], mistakes: ['ดึงด้วยมือ'], alts: ['lateralRaise'] }),
  E('facePull', { name: 'Face Pull', th: 'เฟซพูล', motion: 'facePull', eq: 'cable', unit: 'lb', inc: 5, primary: ['rearDelts', 'upperBack'], secondary: ['traps'],
    cues: ['ตั้งรอกระดับหน้าผาก ใช้เชือก', 'ดึงเข้าหาหน้า แยกมือออกข้างหู', 'จบท่าเหมือนโชว์กล้ามสองแขน'], mistakes: ['หนักเกินจนเอนตัวดึง'], alts: ['reversePecDeck'] }),
  E('reversePecDeck', { name: 'Reverse Pec Deck', th: 'รีเวิร์สเพ็กเด็ค', motion: 'facePull', eq: 'machine', unit: 'lb', inc: 5, primary: ['rearDelts'], secondary: ['upperBack'],
    cues: ['แขนเกือบตรง กางออกเป็นวงกว้าง'], mistakes: ['บีบสะบักแรงเกินจนบ่าทำงานแทน'], alts: ['facePull'] }),

  // ---------------- triceps
  E('ropePushdown', { name: 'Rope Triceps Pushdown', th: 'เคเบิลกดเชือก', motion: 'pushdown', eq: 'cable', unit: 'lb', inc: 5, primary: ['triceps'],
    cues: ['ศอกแนบลำตัว ไม่ขยับ', 'กดสุดแล้วแยกเชือกออก', 'ปล่อยขึ้นช้า'], mistakes: ['ศอกลอยไปข้างหน้า', 'โยกตัวช่วย'], alts: ['overheadCableExt'] }),
  E('overheadCableExt', { name: 'Overhead Triceps Extension', th: 'เหยียดแขนเหนือหัว', motion: 'overheadTriceps', eq: 'cable', unit: 'lb', inc: 5, primary: ['triceps'],
    cues: ['ศอกชี้ขึ้นเพดาน ไม่กาง', 'ลงลึกจนหลังแขนยืด — ช่วงที่โตดีที่สุด'], mistakes: ['ศอกบานออก', 'แอ่นหลัง'], alts: ['ropePushdown'] }),

  // ---------------- back
  E('pullUp', { name: 'Pull-up', th: 'ดึงข้อ', motion: 'pullUp', eq: 'bodyweight', kind: 'bw', primary: ['lats'], secondary: ['biceps', 'upperBack', 'rearDelts'],
    cues: ['เริ่มด้วยการกดสะบักลง แล้วค่อยงอแขน', 'คางพ้นบาร์', 'ลงจนแขนเกือบตรง'], mistakes: ['เหวี่ยงตัว (kipping)', 'ขึ้นไม่สุด-ลงไม่สุด'], alts: ['assistedPullUp', 'latPulldown'] }),
  E('assistedPullUp', { name: 'Assisted Pull-up', th: 'ดึงข้อเครื่องช่วย', motion: 'pullUp', eq: 'machine', unit: 'lb', inc: 5, primary: ['lats'], secondary: ['biceps', 'upperBack'],
    cues: ['ตัวเลขยิ่งน้อย = ยิ่งหนัก', 'ลดตัวช่วยลงเมื่อทำครบเรพ'], mistakes: ['ใช้ตัวช่วยเยอะจนง่ายเกิน'], alts: ['pullUp', 'latPulldown'] }),
  E('latPulldown', { name: 'Lat Pulldown (Wide)', th: 'แลตพูลดาวน์', motion: 'latPulldown', eq: 'cable', unit: 'lb', inc: 5, primary: ['lats'], secondary: ['biceps', 'upperBack', 'rearDelts'],
    cues: ['ดึงบาร์ลงหาอกบน เอนหลังเล็กน้อย', 'คิดว่าดึงศอกลงไปที่กระเป๋ากางเกง', 'ปล่อยขึ้นจนสะบักยืด'], mistakes: ['ดึงลงหลังคอ', 'เอนหลังมากจนกลายเป็นท่าโรว์'], alts: ['pullUp', 'closeGripPulldown'] }),
  E('closeGripPulldown', { name: 'Close-grip Pulldown', th: 'พูลดาวน์จับแคบ', motion: 'latPulldown', eq: 'cable', unit: 'lb', inc: 5, primary: ['lats'], secondary: ['biceps', 'upperBack'],
    cues: ['ใช้ด้ามจับ V', 'ดึงลงถึงอกล่าง ศอกชิดตัว'], mistakes: ['ใช้แรงแขนนำ'], alts: ['latPulldown'] }),
  E('seatedCableRow', { name: 'Seated Cable Row', th: 'เคเบิลโรว์นั่ง', motion: 'cableRow', eq: 'cable', unit: 'lb', inc: 5, primary: ['upperBack', 'lats'], secondary: ['biceps', 'rearDelts'],
    cues: ['อกตั้ง ดึงด้ามจับเข้าหาสะดือ', 'บีบสะบักค้าง 1 วินาที', 'ยื่นไปข้างหน้าให้หลังยืดได้ แต่หลังไม่งอ'], mistakes: ['โยกตัวไปมาเหมือนพายเรือ'], alts: ['chestSupportedRow', 'dbRow'] }),
  E('chestSupportedRow', { name: 'Chest-supported Machine Row', th: 'โรว์เครื่องพิงอก', motion: 'cableRow', eq: 'machine', unit: 'lb', inc: 5, primary: ['upperBack', 'lats'], secondary: ['biceps', 'rearDelts'],
    cues: ['อกแนบเบาะตลอด ไม่ช่วยด้วยหลัง'], mistakes: ['อกลอยจากเบาะ'], alts: ['seatedCableRow'] }),
  E('dbRow', { name: 'One-arm Dumbbell Row', th: 'ดัมเบลโรว์', motion: 'bentRow', eq: 'dumbbell', perSide: true, inc: 2, primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts'],
    cues: ['หลังตรงขนานพื้น', 'ดึงดัมเบลไปทางสะโพก ไม่ใช่ขึ้นหาไหล่'], mistakes: ['บิดลำตัวเพื่อยก'], alts: ['seatedCableRow', 'bbRow'] }),
  E('bbRow', { name: 'Barbell Row', th: 'บาร์เบลโรว์', motion: 'bbRow', eq: 'barbell', primary: ['upperBack', 'lats'], secondary: ['biceps', 'rearDelts', 'lowerBack'],
    cues: ['พับสะโพก ลำตัว ~45°', 'ดึงบาร์ไปที่ท้องส่วนบน'], mistakes: ['ยืดตัวขึ้นทุกครั้งที่ดึง'], alts: ['dbRow', 'tbarRow'] }),
  E('tbarRow', { name: 'T-Bar Row', th: 'ทีบาร์โรว์', motion: 'bbRow', eq: 'barbell', primary: ['upperBack', 'lats'], secondary: ['biceps', 'lowerBack'],
    cues: ['อกยืด หลังตรง ดึงด้ามเข้าหาอก'], mistakes: ['หลังงอ'], alts: ['bbRow'] }),

  // ---------------- biceps
  E('bbCurl', { name: 'Barbell Curl', th: 'บาร์เบลเคิร์ล', motion: 'curl', eq: 'barbell', primary: ['biceps'], secondary: ['forearms'],
    cues: ['ศอกนิ่งข้างลำตัว', 'ลงจนแขนเกือบตรง'], mistakes: ['เหวี่ยงหลัง', 'ศอกเลื่อนมาข้างหน้า'], alts: ['ezCurl', 'dbCurl'] }),
  E('ezCurl', { name: 'EZ-Bar Curl', th: 'อีแซดเคิร์ล', motion: 'curl', eq: 'barbell', primary: ['biceps'], secondary: ['forearms'],
    cues: ['ข้อมือสบายกว่าบาร์ตรง', 'บีบค้างข้างบน'], mistakes: ['ใช้แรงเหวี่ยง'], alts: ['bbCurl', 'cableCurl'] }),
  E('dbCurl', { name: 'Dumbbell Curl', th: 'ดัมเบลเคิร์ล', motion: 'dbCurl', eq: 'dumbbell', perSide: true, inc: 1, primary: ['biceps'], secondary: ['forearms'],
    cues: ['บิดฝ่ามือหงายขึ้นระหว่างยก'], mistakes: ['ยกเร็วลงเร็ว'], alts: ['ezCurl', 'hammerCurl'] }),
  E('hammerCurl', { name: 'Hammer Curl', th: 'แฮมเมอร์เคิร์ล', motion: 'hammerCurl', eq: 'dumbbell', perSide: true, inc: 1, primary: ['biceps', 'forearms'],
    cues: ['ฝ่ามือหันเข้าหากันตลอด', 'ยกสลับหรือพร้อมกันก็ได้'], mistakes: ['ไหล่ช่วยยก'], alts: ['dbCurl'] }),
  E('cableCurl', { name: 'Cable Curl', th: 'เคเบิลเคิร์ล', motion: 'curl', eq: 'cable', unit: 'lb', inc: 5, primary: ['biceps'], secondary: ['forearms'],
    cues: ['แรงตึงคงที่ตลอดทาง'], mistakes: ['ถอยห่างเครื่องเกิน'], alts: ['ezCurl'] }),

  // ---------------- legs
  E('backSquat', { name: 'Back Squat', th: 'แบ็กสควอท', motion: 'backSquat', eq: 'barbell', primary: ['quads', 'glutes'], secondary: ['adductors', 'hamstrings', 'lowerBack', 'abs'],
    cues: ['หายใจเข้าท้อง เกร็งแกนกลางก่อนลงทุกเรพ', 'เข่าชี้ไปทางเดียวกับปลายเท้า', 'ลงจนสะโพกเสมอเข่าหรือต่ำกว่า'], mistakes: ['เข่าหุบเข้าตอนดันขึ้น', 'ส้นเท้าลอย', 'หลังงอที่จุดต่ำสุด'], alts: ['hackSquat', 'gobletSquat', 'legPress'] }),
  E('frontSquat', { name: 'Front Squat', th: 'ฟรอนต์สควอท', motion: 'frontSquat', eq: 'barbell', primary: ['quads'], secondary: ['glutes', 'abs', 'upperBack'],
    cues: ['ศอกยกสูง บาร์วางบนไหล่หน้า', 'ลำตัวตั้งตรงกว่าแบ็กสควอท'], mistakes: ['ศอกตก บาร์ไหลไปข้างหน้า'], alts: ['gobletSquat', 'backSquat'] }),
  E('gobletSquat', { name: 'Goblet Squat', th: 'กอบเล็ตสควอท', motion: 'gobletSquat', eq: 'dumbbell', inc: 2, primary: ['quads', 'glutes'], secondary: ['adductors', 'abs'],
    cues: ['ถือดัมเบลชิดอก', 'ศอกลงไประหว่างเข่า'], mistakes: ['ลำตัวพับไปข้างหน้า'], alts: ['backSquat'] }),
  E('hackSquat', { name: 'Hack Squat', th: 'แฮกสควอท', motion: 'hackSquat', eq: 'machine', primary: ['quads'], secondary: ['glutes', 'adductors'],
    cues: ['หลังแนบเบาะ เท้ากลางแท่น', 'ลงลึกเท่าที่หลังไม่ลอย'], mistakes: ['ลงตื้น'], alts: ['legPress', 'backSquat'] }),
  E('legPress', { name: 'Leg Press', th: 'เลกเพรส', motion: 'legPress', eq: 'machine', perSide: true, inc: 5, primary: ['quads', 'glutes'], secondary: ['adductors', 'hamstrings'],
    cues: ['เท้ากว้างช่วงไหล่ กลางแท่น', 'ลงจนเข่าทำมุม ~90°', 'ไม่ล็อกเข่าข้างบน'], mistakes: ['ก้นยกจากเบาะตอนลงลึก', 'ล็อกเข่า'], alts: ['hackSquat', 'backSquat'] }),
  E('rdl', { name: 'Romanian Deadlift', th: 'โรมาเนียนเดดลิฟต์', motion: 'rdl', eq: 'barbell', primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'upperBack', 'forearms'],
    cues: ['ดันสะโพกไปข้างหลัง เข่างอเล็กน้อยคงที่', 'บาร์รูดใกล้ขาตลอด', 'ลงจนแฮมตึง (ราวกลางหน้าแข้ง)'], mistakes: ['หลังงอ', 'กลายเป็นสควอท', 'บาร์ห่างตัว'], alts: ['dbRdl'] }),
  E('dbRdl', { name: 'Dumbbell RDL', th: 'ดัมเบลโรมาเนียน', motion: 'dbRdl', eq: 'dumbbell', perSide: true, inc: 2, primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'forearms'],
    cues: ['เหมือน RDL บาร์เบล ดัมเบลรูดหน้าขา'], mistakes: ['หลังงอ'], alts: ['rdl'] }),
  E('hipThrust', { name: 'Barbell Hip Thrust', th: 'ฮิปทรัสต์', motion: 'hipThrust', eq: 'barbell', primary: ['glutes'], secondary: ['hamstrings', 'quads'],
    cues: ['สะบักพาดขอบม้านั่ง คางเก็บ', 'ดันสะโพกขึ้นจนลำตัวขนานพื้น บีบก้นค้าง 1 วินาที', 'หน้าแข้งตั้งฉากพื้นตอนบนสุด'], mistakes: ['แอ่นหลังล่างแทนการบีบก้น', 'เท้าไกลเกิน'], alts: ['gluteBridge'] }),
  E('gluteBridge', { name: 'Glute Bridge', th: 'กลูตบริดจ์', motion: 'hipThrust', eq: 'bodyweight', kind: 'bw', primary: ['glutes'], secondary: ['hamstrings'],
    cues: ['บีบก้นค้างข้างบน'], mistakes: ['แอ่นหลัง'], alts: ['hipThrust'] }),
  E('bulgarianSplitSquat', { name: 'Bulgarian Split Squat', th: 'บัลแกเรียนสปลิตสควอท', motion: 'splitSquat', eq: 'dumbbell', perSide: true, inc: 2, primary: ['quads', 'glutes'], secondary: ['adductors', 'hamstrings'],
    cues: ['เท้าหลังพาดม้านั่ง น้ำหนักอยู่ขาหน้า', 'ลงตรงๆ จนเข่าหลังเกือบแตะพื้น', 'เอนตัวเล็กน้อย = ก้นทำงานมากขึ้น'], mistakes: ['เท้าหน้าใกล้ม้านั่งเกิน', 'เข่าหน้าหุบเข้า'], alts: ['walkingLunge', 'reverseLunge'] }),
  E('walkingLunge', { name: 'Walking Lunge', th: 'ลันจ์เดิน', motion: 'lunge', eq: 'dumbbell', perSide: true, inc: 2, primary: ['quads', 'glutes'], secondary: ['adductors'],
    cues: ['ก้าวยาวพอให้เข่าหน้าอยู่เหนือข้อเท้า'], mistakes: ['ก้าวสั้นจนเข่าล้ำ'], alts: ['bulgarianSplitSquat'] }),
  E('reverseLunge', { name: 'Reverse Lunge', th: 'ลันจ์ถอยหลัง', motion: 'lunge', eq: 'dumbbell', perSide: true, inc: 2, primary: ['quads', 'glutes'], secondary: ['adductors'],
    cues: ['ถอยเท้าไปข้างหลัง ง่ายต่อเข่ากว่าก้าวหน้า'], mistakes: ['ลำตัวโยก'], alts: ['bulgarianSplitSquat'] }),
  E('stepUp', { name: 'Dumbbell Step-up', th: 'สเต็ปอัพ', motion: 'stepUp', eq: 'dumbbell', perSide: true, inc: 2, primary: ['quads', 'glutes'], secondary: ['calves'],
    cues: ['ดันผ่านส้นเท้าขาบนกล่อง ไม่ใช้ขาล่างดีด'], mistakes: ['ใช้ขาหลังส่ง'], alts: ['reverseLunge'] }),
  E('legExtension', { name: 'Leg Extension', th: 'เลกเอ็กซ์เทนชัน', motion: 'legExtension', eq: 'machine', unit: 'lb', inc: 5, primary: ['quads'],
    cues: ['จัดแกนหมุนของเครื่องตรงเข่า', 'เหยียดสุดบีบค้าง 1 วินาที', 'ลงช้า'], mistakes: ['เตะขึ้นด้วยแรงเหวี่ยง'], alts: ['gobletSquat'] }),
  E('seatedLegCurl', { name: 'Seated Leg Curl', th: 'เลกเคิร์ลนั่ง', motion: 'legCurl', eq: 'machine', unit: 'lb', inc: 5, primary: ['hamstrings'], secondary: ['calves'],
    cues: ['แบบนั่งยืดแฮมได้มากกว่าแบบนอน — โตดีกว่า', 'เอนตัวไปข้างหน้าเล็กน้อยเพิ่มการยืด'], mistakes: ['ก้นยกจากเบาะ'], alts: ['lyingLegCurl'] }),
  E('lyingLegCurl', { name: 'Lying Leg Curl', th: 'เลกเคิร์ลนอน', motion: 'legCurl', eq: 'machine', unit: 'lb', inc: 5, primary: ['hamstrings'], secondary: ['calves'],
    cues: ['สะโพกกดเบาะ', 'ลงช้า 3 วินาที'], mistakes: ['สะโพกยก'], alts: ['seatedLegCurl'] }),
  E('standingCalfRaise', { name: 'Standing Calf Raise', th: 'เขย่งน่อง', motion: 'calfRaise', eq: 'dumbbell', perSide: true, inc: 2, primary: ['calves'],
    cues: ['ลงให้ส้นต่ำกว่าขั้นบันได ยืดสุด ค้าง 1 วินาที', 'ขึ้นสุดปลายเท้า'], mistakes: ['เด้งเร็ว ไม่ยืดสุด'], alts: ['seatedCalfRaise'] }),
  E('seatedCalfRaise', { name: 'Seated Calf Raise', th: 'เขย่งน่องนั่ง', motion: 'seatedCalfRaise', eq: 'machine', inc: 2.5, primary: ['calves'],
    cues: ['เน้นน่องชั้นใน (soleus)', 'ค้างล่าง 1 วินาที'], mistakes: ['ช่วงสั้น'], alts: ['standingCalfRaise'] }),
  E('adductorMachine', { name: 'Hip Adduction Machine', th: 'เครื่องหนีบขา', motion: 'adductor', eq: 'machine', unit: 'lb', inc: 5, primary: ['adductors'],
    cues: ['หนีบเข้าแล้วค้าง 1 วินาที', 'ปล่อยออกช้า'], mistakes: ['ปล่อยกระแทก'], alts: ['gobletSquat'] }),
  E('abductorMachine', { name: 'Hip Abduction Machine', th: 'เครื่องถ่างขา', motion: 'abductor', eq: 'machine', unit: 'lb', inc: 5, primary: ['abductors', 'glutes'],
    cues: ['เอนตัวไปข้างหน้าเล็กน้อย = ก้นทำงานมากขึ้น'], mistakes: ['เด้งเร็ว'], alts: [] }),

  // ---------------- core
  E('plank', { name: 'Plank', th: 'แพลงก์', motion: 'plank', eq: 'bodyweight', kind: 'time', primary: ['abs'], secondary: ['obliques', 'frontDelts'],
    cues: ['บีบก้น เกร็งท้องเหมือนจะโดนต่อย', 'ลำตัวตรงเป็นเส้นเดียว'], mistakes: ['สะโพกตก', 'ก้นโด่ง'], alts: ['deadBug'] }),
  E('deadBug', { name: 'Dead Bug', th: 'เดดบัก', motion: 'deadBug', eq: 'bodyweight', kind: 'bw', primary: ['abs'], secondary: ['obliques'],
    cues: ['หลังล่างกดพื้นตลอด', 'เหยียดแขนกับขาตรงข้ามช้าๆ', 'หายใจออกตอนเหยียด'], mistakes: ['หลังแอ่นลอย'], alts: ['plank'] }),
  E('pallofPress', { name: 'Pallof Press', th: 'พาลอฟเพรส', motion: 'pallof', eq: 'cable', unit: 'lb', inc: 5, primary: ['obliques', 'abs'],
    cues: ['ยืนตะแคงเครื่อง ดันมือออกตรงๆ ค้าง 2 วินาที', 'ไม่ให้ลำตัวบิดตามสาย'], mistakes: ['ยืนใกล้เครื่องเกินจนไม่มีแรงต้าน'], alts: ['plank'] }),

  // ---------------- cardio
  E('inclineWalk', { name: 'Incline Treadmill Walk', th: 'เดินชันลู่วิ่ง', motion: 'walk', eq: 'cardio', kind: 'cardio', primary: ['calves', 'glutes'], secondary: ['hamstrings', 'quads'],
    cues: ['ชัน 8–12% ความเร็ว 5–6 กม./ชม.', 'ไม่จับราว — ถ้าต้องจับแปลว่าเร็ว/ชันเกิน', 'Zone 2 = ยังพูดเป็นประโยคได้'], mistakes: ['จับราวเอนหลัง'], alts: ['bike'] }),
  E('bike', { name: 'Stationary Bike', th: 'ปั่นจักรยาน', motion: 'walk', eq: 'cardio', kind: 'cardio', primary: ['quads'], secondary: ['calves', 'glutes'],
    cues: ['Interval: หนัก 30 วิ / เบา 60 วิ', 'Zone 2: รอบขา ~80–90 rpm สบายๆ'], mistakes: ['เบาะต่ำเกิน เข่าเจ็บ'], alts: ['inclineWalk'] }),
  E('stairmaster', { name: 'Stairmaster', th: 'เครื่องขึ้นบันได', motion: 'stepUp', eq: 'cardio', kind: 'cardio', primary: ['glutes', 'quads'], secondary: ['calves'],
    cues: ['ยืนตรง ไม่โหนราว', 'ก้าวเต็มขั้น'], mistakes: ['พิงราวรับน้ำหนัก'], alts: ['inclineWalk'] }),
];

export const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// muscle → body-region groups (for radar / filters)
export const GROUPS = {
  chest: { th: 'อก', muscles: ['chest'] },
  back: { th: 'หลัง', muscles: ['lats', 'upperBack', 'traps', 'lowerBack'] },
  shoulders: { th: 'ไหล่', muscles: ['frontDelts', 'sideDelts', 'rearDelts'] },
  arms: { th: 'แขน', muscles: ['biceps', 'triceps', 'forearms'] },
  legs: { th: 'ขา', muscles: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves'] },
  core: { th: 'แกนกลาง', muscles: ['abs', 'obliques'] },
};
export const EQ_TH = { barbell: 'บาร์เบล', dumbbell: 'ดัมเบล', machine: 'เครื่อง', cable: 'เคเบิล', bodyweight: 'น้ำหนักตัว', cardio: 'คาร์ดิโอ' };
