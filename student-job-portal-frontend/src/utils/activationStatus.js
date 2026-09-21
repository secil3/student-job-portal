export const isRecordActive = (record) => Number(record?.is_active) === 1;

export const updateRecordActivation = (records, recordId, isActive) =>
  records.map((record) => (
    Number(record.id) === Number(recordId)
      ? {
          ...record,
          is_active: isActive ? 1 : 0,
          deactivated_at: isActive ? null : record.deactivated_at,
        }
      : record
  ));
