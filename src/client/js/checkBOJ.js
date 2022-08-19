import axios from "axios";
const BOJ_Form = document.getElementById("BOJ");
const BOJ_ID = BOJ_Form.querySelector("#BOJ-ID");
const BOJ_EXP = BOJ_Form.querySelector("#BOJ-EXP");
const authSpan = document.getElementById("AUTH");
const userID = document.getElementById("userID");

const userOptions = {
  method: "GET",
  url: "https://solved.ac/api/v3/user/show",
  params: { handle: "" },
  headers: { "Content-Type": "application/json" },
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const user = BOJ_ID.value;
  userOptions.params.handle = user;

  try {
    const result = await axios.request(userOptions);
    if (result.status == 200) {
      const {
        data: { handle, exp },
      } = result;

      const inputExp = Number(BOJ_EXP.value);

      if (handle !== user) {
        authSpan.innerText = "인증 실패: 아이디를 정확하게 입력해주세요.";
        return;
      }
      if (exp !== inputExp) {
        console.log("exp fail");
        authSpan.innerText = "인증 실패: 경험치를 정확하게 입력해주세요.";
        return;
      }
    }
    authSpan.innerText = "인증 성공";
    userID.value = user;
    document.querySelector("#subForm").dataset.flag = "true";
    //console.log(document.querySelector("#subForm").dataset.flag);
  } catch (err) {
    console.log(err);
    authSpan.innerText = "인증 실패";
  }
};

BOJ_Form.addEventListener("submit", handleSubmit);
