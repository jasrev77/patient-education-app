export type Pharmacy = {
  id: string;
  name: string;
  slug: string;
};

export type DrugEducation = {
  id: string;
  pharmacy_id: string;
  gpi: string;
  title: string;
  video_url: string | null;
  summary: string | null;
  last_checked: string | null;
};
