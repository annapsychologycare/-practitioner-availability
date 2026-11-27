import React,{useMemo} from 'react';
import type {PractitionerEmailData} from '../utils/emailBuilder';
import {clientPreviewProfiles} from '../utils/clientPagePreview';
import {ClientMatchingExperience} from './ClientMatchingExperience';
interface Props {practitioners:PractitionerEmailData[];includeMonthly:boolean;age60Plus:boolean;now:Date;onBack:()=>void;clientName?:string;recommendationNotes?:Record<string,string>;feeArrangements?:Record<string,{businessHours?:number;afterHours?:number;standard?:number;approved:boolean}>;}
export const ClientPagePreview:React.FC<Props>=({practitioners,includeMonthly,now,feeArrangements,...rest})=>{
 const profiles=useMemo(()=>clientPreviewProfiles(practitioners,includeMonthly,now,feeArrangements),[practitioners,includeMonthly,now,feeArrangements]);
 return <ClientMatchingExperience {...rest} profiles={profiles}/>;
};
