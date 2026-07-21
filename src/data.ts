export const APP = { name: 'Vyrlo', slogan: 'Kenya is live.', currency: 'KES', locale: 'en-KE' }
export type Creator={id:string;name:string;handle:string;verified?:boolean;followers:number;views:number;bio:string;live?:boolean;accent:string}
export type Stream={id:string;creatorId:string;title:string;category:string;language:string;viewers:number;duration:string;tags:string[];accent:string;created:number}
export type Clip={id:string;creatorId:string;title:string;views:number;duration:string;age:string;accent:string}
export const creators:Creator[]=[
['nairobi-night-owl','NairobiNightOwl','@nightowlke',true,48200,913000,'Late-night stories, city culture and honest conversations from Nairobi.',true,'#ff5d45'],
['gamer-wa-mtaa','GamerWaMtaa','@gamerwamtaa',true,33500,702000,'Football games, banter and tournaments from the heart of Eastlands.',true,'#e9b949'],
['dj-amani','DJAmani','@djamani',true,71900,1400000,'Afro-house, gengetone and sounds moving Kenya.',true,'#d75cff'],
['campus-plug','CampusPlugKE','@campusplugke',false,19400,380000,'Campus stories and student life from universities across Kenya.',true,'#45c486'],
['code-njeri','CodeWithNjeri','@codewithnjeri',true,28600,610000,'Practical coding sessions and career advice for African developers.',true,'#31b7ff'],
['shiko-plays','ShikoPlays','@shikoplays',false,24100,522000,'Mobile gaming, ranked grinds and squad nights.',true,'#ff4f82'],
['mombasa-vibes','MombasaVibes','@mombasavibes',true,56200,1020000,'Music, food and lifestyle from the Kenyan coast.',true,'#28d5c2'],
['football-base','TheFootballBaseKE','@footballbaseke',true,44100,880000,'Local and international football talk without the boring bits.',true,'#8dd63f'],
['cheka-na-wanjiku','ChekaNaWanjiku','@chekanawanjiku',false,15200,290000,'Sketches, improv and a little Nairobi chaos.',false,'#ff8c42'],
['rift-runners','RiftValleyRunners','@riftrunners',false,9800,177000,'Running culture, race prep and trails from the Rift Valley.',false,'#9c7cff'],
['tech-boma','TechBoma','@techboma',false,12300,234000,'African tech, startups and useful gadgets.',false,'#49c96d'],
['sauti-sessions','SautiSessions','@sautisessions',false,21600,410000,'Intimate acoustic performances and new Kenyan voices.',false,'#ffca56']
].map(([id,name,handle,verified,followers,views,bio,live,accent])=>({id,name,handle,verified,followers,views,bio,live,accent} as Creator))
const s=(id:string,creatorId:string,title:string,category:string,language:string,viewers:number,duration:string,tags:string[],accent:string,created:number):Stream=>({id,creatorId,title,category,language,viewers,duration,tags,accent,created})
export const streams:Stream[]=[
s('city-after-dark','nairobi-night-owl','Nairobi after dark: stories from the 254','Just Chatting','Sheng',12400,'02:18:42',['Nairobi','Stories','Late night'],'#ff5d45',12),
s('road-to-elite','gamer-wa-mtaa','Road to Elite Division — no excuses leo','EA Sports FC','Kiswahili',8700,'01:42:16',['Competitive','Football','PS5'],'#e9b949',6),
s('amani-friday','dj-amani','Friday rooftop set: Nairobi to the world','Music','English',16200,'00:58:07',['Afro House','Gengetone','DJ Set'],'#d75cff',2),
s('campus-confessions','campus-plug','Campus confessions: fresher edition','Campus Life','Sheng',5100,'01:12:39',['Campus','Stories'],'#45c486',18),
s('react-build','code-njeri','We build a biashara app in React — live coding','Technology','English',4200,'02:04:22',['React','Coding','Careers'],'#31b7ff',8),
s('codm-ranked','shiko-plays','Legendary rank push with the squad','Call of Duty Mobile','Kiswahili',6600,'03:21:10',['Mobile','Ranked','Squad'],'#ff4f82',4),
s('coast-sunset','mombasa-vibes','Sunset sounds from Mama Ngina waterfront','Lifestyle','Kiswahili',9300,'00:46:55',['Mombasa','Travel','Music'],'#28d5c2',1),
s('derby-debate','football-base','Big derby preview — your calls, our takes','Football Talk','English',7800,'01:33:47',['Premier League','Debate'],'#8dd63f',9),
s('open-mic','cheka-na-wanjiku','Open mic rehearsal — jokes may fail 😅','Comedy','Kiswahili',2100,'00:39:22',['Comedy','Open mic'],'#ff8c42',16),
s('trail-prep','rift-runners','Trail race prep: easy morning session','Lifestyle','Kalenjin',1500,'00:51:06',['Running','Fitness'],'#9c7cff',20),
s('phone-review','tech-boma','Budget phones under 30K: honest picks','Technology','English',3200,'01:08:42',['Gadgets','Reviews'],'#49c96d',14),
s('acoustic-room','sauti-sessions','New voices: acoustic room live','Music','Kiswahili',3700,'00:44:19',['Acoustic','Live Music'],'#ffca56',10)]
export const categories=['Just Chatting','EA Sports FC','Call of Duty Mobile','Music','Comedy','Campus Life','Technology','Football Talk','Esports','Lifestyle']
export const categoryMeta=categories.map((name,i)=>({name,live:[38,24,19,31,12,17,22,28,15,26][i],accent:['#ff5d45','#e9b949','#ff4f82','#d75cff','#ff8c42','#45c486','#31b7ff','#8dd63f','#9c7cff','#28d5c2'][i]}))
export const events=[['Kenyan University Esports Finals','Sat, 26 Jul','6:00 PM'],['Nairobi Creators Live','Sun, 3 Aug','4:30 PM'],['Friday Night DJ Battle','Fri, 8 Aug','9:00 PM'],['EA Sports FC Community Tournament','Sat, 16 Aug','2:00 PM']]
export const clips:Clip[]=Array.from({length:12},(_,i)=>({id:`clip-${i+1}`,creatorId:creators[i%creators.length].id,title:['That last-minute goal was WILD','The matatu story nobody believed','Cleanest transition of the night','When the code works first try','Campus roommate chronicles','1v4 clutch on mobile','Mombasa sunset hits different','The prediction aged perfectly','Crowd work went left','Final kilometre energy','Best budget camera test','An acoustic moment'][i],views:[128000,92000,76000,54000,47000,88000,61000,103000,35000,29000,42000,67000][i],duration:['0:32','0:48','0:27','0:41','0:55','0:24','0:39','0:46','0:31','0:58','0:44','0:52'][i],age:i<4?'Today':i<8?'3 days ago':'1 week ago',accent:creators[i].accent}))
export const chatMessages=Array.from({length:22},(_,i)=>({id:i+1,user:['Akinyi254','Moha_KE','Wanjau','SupaStrika','NjeriN','TessWaCoast','KiptooRuns'][i%7],text:['Hii story ni kali 😂','Watching from Kisumu!','W creator W community','Sasa chat!','That camera angle though 🔥','Tuko live kabisa','Volume iko sawa'][i%7],badge:i%5===0?'OG':i%7===0?'MOD':undefined}))
export const transactions=Array.from({length:8},(_,i)=>({id:`TX-${8240+i}`,type:i%3===0?'Payout':i%2===0?'Subscription':'Support',name:i%3===0?'M-Pesa withdrawal':['Akinyi254','Moha_KE','Wanjau','TessWaCoast'][i%4],date:`${16-i} Jul 2026`,amount:i%3===0?-2500:[100,250,500,750][i%4]}))
export const creatorById=(id:string)=>creators.find(c=>c.id===id)??creators[0]
export const formatCount=(n:number)=>n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${(n/1e3).toFixed(n>=1e4?0:1)}K`:`${n}`
export const money=(n:number)=>new Intl.NumberFormat(APP.locale,{style:'currency',currency:APP.currency,maximumFractionDigits:0}).format(n)
