// A job is the same customer record as the enquiry, opened from Jobs.
// The progress bar shows every step from Won to aftercare, and the main button is always the next one.
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { IconBriefcase } from '@tabler/icons-react';
import { Empty } from '../components/ui';
import { useStore } from '../data/store';
import EnquiryRecord from './EnquiryRecord';

export default function JobDetail() {
  const { id } = useParams();
  const { enquiries } = useStore();
  const e = enquiries.find(x => x.jobId === id) || enquiries.find(x => x.id === id);
  if (!e) return <Empty icon={<IconBriefcase size={22} />} title="Job not found" sub="It may still be an enquiry." action={<Link to="/jobs" className="btn btn-primary btn-sm">Back to jobs</Link>} />;
  return <EnquiryRecord recordId={e.id} from="jobs" />;
}
