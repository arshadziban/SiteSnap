import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import { useCreateJob } from "../hooks/useCreateJob";

export default function Home() {
  const navigate = useNavigate();
  const { submit, isSubmitting, error } = useCreateJob();

  const handleSubmit = async (urls: string[]) => {
    const jobId = await submit(urls);
    if (jobId) {
      navigate(`/job/${jobId}`);
    }
  };

  return <Hero onSubmit={handleSubmit} isSubmitting={isSubmitting} errorMessage={error} />;
}
