export default function ExportToolbar({
  exportDate,
  setExportDate,

  exportedBy,
  setExportedBy,

  channelNote,
  setChannelNote,

  search,
  setSearch,

  scanCode,
  setScanCode,

  scanStatus,

  onScan,

  scanInputRef,
}) {
  const submitScan =
    () => {
      const code =
        String(
          scanCode ||
            ""
        ).trim();

      if (!code) {
        return;
      }

      onScan(
        code
      );
    };

  const statusClass =
    `export-scan-status ${scanStatus?.type || "idle"}`;

  return (
    <>
      {/* ===================================================
          QUÉT NHANH
      =================================================== */}

      <section className="export-scan-panel">

        <div className="export-scan-title">

          <strong>
            Quét nhanh xuất kho cuối ngày
          </strong>

          <span>
            Mỗi lần quét sẽ +1. Hệ thống chặn nếu số lượng vượt tồn.
          </span>

        </div>

        <div className="export-scan-input-wrap">

          <input
            ref={
              scanInputRef
            }

            autoFocus

            value={
              scanCode
            }

            placeholder="Quét barcode / SKU rồi Enter"

            onChange={(e) =>
              setScanCode(
                e.target.value
              )
            }

            onKeyDown={(e) => {
              if (
                e.key ===
                "Enter"
              ) {
                e.preventDefault();

                submitScan();
              }
            }}
          />

        </div>

        <div
          className={
            statusClass
          }
        >
          {scanStatus?.message ||
            "Chưa quét."}
        </div>

      </section>

      {/* ===================================================
          THÔNG TIN PHIẾU
      =================================================== */}

      <section className="export-info-card">

        <div className="export-info-grid">

          <div className="export-field">

            <label>
              Ngày
            </label>

            <input
              type="date"

              value={
                exportDate
              }

              onChange={(e) =>
                setExportDate(
                  e.target.value
                )
              }
            />

          </div>


          <div className="export-field">

            <label>
              Người xuất
            </label>

            <input
              value={
                exportedBy
              }

              placeholder="Nhập tên người xuất"

              onChange={(e) =>
                setExportedBy(
                  e.target.value
                )
              }
            />

          </div>


          <div className="export-field">

            <label>
              Kênh / ghi chú
            </label>

            <input
              value={
                channelNote
              }

              placeholder="Shopee, TikTok, bán sỉ..."

              onChange={(e) =>
                setChannelNote(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="export-search-wrap">

          <input
            value={
              search
            }

            placeholder="Tìm sản phẩm, size, SKU hoặc barcode"

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {search && (
            <button
              type="button"

              className="export-clear-search"

              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

      </section>
    </>
  );
}