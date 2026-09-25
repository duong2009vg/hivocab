/**
 * HiVocab Data Service (ESM Wrapper for HiDB)
 * Seamlessly interfaces with existing HiDB instance and Supabase client
 */
export const getHiDB = () => {
  if (typeof window !== 'undefined' && window.HiDB) {
    return window.HiDB;
  }
  return null;
};

export const HiDB = (typeof window !== 'undefined' && window.HiDB) ? window.HiDB : null;
export default HiDB;
