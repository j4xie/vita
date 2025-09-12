// 姓名验证功能测试脚本
// 测试Web端姓名验证功能在中文和英文环境下的表现

const testCases = [
  {
    name: "中文环境 - 正确的中文姓名",
    language: "zh-CN",
    data: {
      firstName: "伟",
      lastName: "张",
      englishNickname: "David"
    },
    expected: {
      valid: true,
      backendData: {
        legalName: "张 伟",
        nickName: "David zhang"
      }
    }
  },
  {
    name: "中文环境 - 英文姓名应显示错误",
    language: "zh-CN", 
    data: {
      firstName: "John",
      lastName: "Smith",
      englishNickname: "John"
    },
    expected: {
      valid: false,
      errors: ["请填写中文", "请填写中文"]
    }
  },
  {
    name: "英文环境 - 中文姓名应该允许",
    language: "en-US",
    data: {
      firstName: "伟",
      lastName: "张", 
      englishNickname: "David"
    },
    expected: {
      valid: true,
      backendData: {
        legalName: "张 伟",
        nickName: "David zhang"
      }
    }
  },
  {
    name: "英文环境 - 英文姓名应该允许",
    language: "en-US",
    data: {
      firstName: "John",
      lastName: "Smith",
      englishNickname: "John"
    },
    expected: {
      valid: true,
      backendData: {
        legalName: "Smith John", 
        nickName: "John smith"
      }
    }
  },
  {
    name: "常用名验证 - 只能输入字母",
    language: "zh-CN",
    data: {
      firstName: "伟",
      lastName: "张",
      englishNickname: "David123"
    },
    expected: {
      valid: false,
      errors: ["常用名只能输入字母（不允许标点符号和空格数字）"]
    }
  },
  {
    name: "常用名验证 - 不允许标点符号",
    language: "zh-CN", 
    data: {
      firstName: "伟",
      lastName: "张",
      englishNickname: "David.Smith"
    },
    expected: {
      valid: false,
      errors: ["常用名只能输入字母（不允许标点符号和空格数字）"]
    }
  },
  {
    name: "常用名验证 - 不允许空格",
    language: "zh-CN",
    data: {
      firstName: "伟", 
      lastName: "张",
      englishNickname: "David Smith"
    },
    expected: {
      valid: false,
      errors: ["常用名只能输入字母（不允许标点符号和空格数字）"]
    }
  },
  {
    name: "家长注册 - 中文环境",
    language: "zh-CN",
    data: {
      firstName: "华",
      lastName: "李"
    },
    expected: {
      valid: true,
      backendData: {
        legalName: "李 华",
        nickName: "华"
      }
    }
  }
];

console.log("🧪 Web端姓名验证功能测试");
console.log("==========================================");
console.log("");

console.log("✅ 测试用例已定义，包含以下场景：");
testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
});

console.log("");
console.log("🌐 Web端服务器已在 http://localhost:8090 启动");
console.log("📋 请手动测试以下功能：");
console.log("");

console.log("1️⃣ 中文系统语言测试：");
console.log("   • 访问注册页面，确认浏览器语言设置为中文");
console.log("   • 在姓氏字段输入 '张'，应该正常");
console.log("   • 在姓氏字段输入 'Smith'，应显示 '请填写中文'");
console.log("   • 在常用名字段输入 'David123'，应显示错误");
console.log("");

console.log("2️⃣ 英文系统语言测试："); 
console.log("   • 切换浏览器语言为英文，或手动修改语言设置");
console.log("   • 在姓氏字段输入中文或英文，都应该允许");
console.log("   • 常用名字段仍然只能输入英文字母");
console.log("");

console.log("3️⃣ 实时验证测试：");
console.log("   • 输入时应立即显示错误信息");
console.log("   • 验证失败时 '下一步' 按钮应被禁用");
console.log("   • 错误消失后按钮应重新启用");
console.log("");

console.log("4️⃣ 后端数据格式测试：");
console.log("   • 学生：常用名 + 空格 + 姓氏拼音");
console.log("   • 家长：简单的姓名拼接");
console.log("");

console.log("🔍 可以通过浏览器开发者工具查看实际的验证逻辑执行情况");
console.log("📱 测试完成后，功能应该符合任务要求的所有规范");