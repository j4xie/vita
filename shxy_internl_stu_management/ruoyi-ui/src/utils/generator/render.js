import { makeMap } from '@/utils/index'

// 参考https://github.com/vuejs/vue/blob/v2.6.10/src/platforms/web/server/util.js
const isAttr = makeMap(
  'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,'
  + 'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,'
  + 'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,'
  + 'name,contenteditable,contextmenu,controls,coords,data,datetime,default,'
  + 'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,'
  + 'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,'
  + 'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,'
  + 'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,'
  + 'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,'
  + 'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,'
  + 'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,'
  + 'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,'
  + 'target,title,type,usemap,value,width,wrap'
)

function vModel(self, dataObject, defaultValue) {
  dataObject.props.value = defaultValue

  dataObject.on.input = val => {
    self.$emit('input', val)
  }
}

const componentChild = {
  'span': {
    // span标签渲染默认值内容
    render(h, conf) {
      return conf.defaultValue || ''
    }
  },
  'el-button': {
    default(h, conf, key) {
      return conf[key]
    },
  },
  'el-input': {
    prepend(h, conf, key) {
      return <template slot="prepend">{conf[key]}</template>
    },
    append(h, conf, key) {
      return <template slot="append">{conf[key]}</template>
    }
  },
  'el-select': {
    options(h, conf, key) {
      const list = []
      conf.options.forEach(item => {
        list.push(<el-option label={item.label} value={item.value} disabled={item.disabled}></el-option>)
      })
      return list
    }
  },
  'el-radio-group': {
    options(h, conf, key) {
      const list = []
      conf.options.forEach(item => {
        if (conf.optionType === 'button') list.push(<el-radio-button label={item.value}>{item.label}</el-radio-button>)
        else list.push(<el-radio label={item.value} border={conf.border}>{item.label}</el-radio>)
      })
      return list
    }
  },
  'el-checkbox-group': {
    options(h, conf, key) {
      const list = []
      conf.options.forEach(item => {
        if (conf.optionType === 'button') {
          list.push(<el-checkbox-button label={item.value}>{item.label}</el-checkbox-button>)
        } else {
          list.push(<el-checkbox label={item.value} border={conf.border}>{item.label}</el-checkbox>)
        }
      })
      return list
    }
  },
  'el-upload': {
    'list-type': (h, conf, key) => {
      const list = []
      if (conf['list-type'] === 'picture-card') {
        list.push(<i class="el-icon-plus"></i>)
      } else {
        list.push(<el-button size="small" type="primary" icon="el-icon-upload">{conf.buttonText}</el-button>)
      }
      if (conf.showTip) {
        list.push(<div slot="tip" class="el-upload__tip">只能上传不超过 {conf.fileSize}{conf.sizeUnit} 的{conf.accept}文件</div>)
      }
      return list
    }
  }
}

// 处理el-upload组件的上传事件
function handleUpload(self, dataObject, conf) {
  // 上传成功后，更新内部file-list状态
  const handleSuccess = function(response, file, fileList) {
    let fileUrl = ''
    if (typeof response === 'string') {
      fileUrl = response
    } else if (response) {
      // 优先取响应中的data字段（后端返回格式：{code: 200, msg: '成功', data: 'url'}）
      fileUrl = response.data || response.url || response
    }
    // 清理URL，去除多余的空格和反引号
    if (typeof fileUrl === 'string') {
      fileUrl = fileUrl.trim().replace(/^`|`$/g, '')
    }
    // 更新内部状态，确保图片能显示
    self.innerFileList = [{
      name: file.name,
      url: fileUrl,
      status: 'success'
    }]
    self.$emit('input', fileUrl)
  }
  
  // 文件删除时清空内部状态
  const handleRemove = function(file, fileList) {
    self.innerFileList = []
    self.$emit('input', null)
  }
  
  // 绑定事件处理器
  dataObject.props['on-success'] = handleSuccess
  dataObject.props['on-remove'] = handleRemove
}

// 根据defaultValue生成回显的文件列表
function getUploadFileList(defaultValue) {
  if (!defaultValue) return []
  let fileUrl = ''
  if (typeof defaultValue === 'string') {
    fileUrl = defaultValue
  } else if (typeof defaultValue === 'object') {
    // 如果defaultValue是对象格式（如后端返回的响应对象），尝试提取data或url字段
    fileUrl = defaultValue.data || defaultValue.url || ''
  }
  // 清理URL
  if (typeof fileUrl === 'string') {
    fileUrl = fileUrl.trim().replace(/^`|`$/g, '')
  }
  if (fileUrl) {
    return [{
      name: 'image',
      url: fileUrl,
      status: 'success'
    }]
  }
  return []
}

export default {
  data() {
    return {
      // 为el-upload维护内部的文件列表状态
      innerFileList: []
    }
  },
  created() {
    // 初始化时如果有默认值，设置回显
    if (this.conf.tag === 'el-upload' && this.conf.defaultValue) {
      this.innerFileList = getUploadFileList(this.conf.defaultValue)
    }
  },
  watch: {
    'conf.defaultValue': {
      handler(newVal) {
        if (this.conf.tag === 'el-upload') {
          // 只有当新值和当前显示的不一致时才更新，避免覆盖刚上传的图片
          const newFileList = getUploadFileList(newVal)
          if (JSON.stringify(newFileList) !== JSON.stringify(this.innerFileList)) {
            this.innerFileList = newFileList
          }
        }
      },
      immediate: false
    }
  },
  render(h) {
    const dataObject = {
      attrs: {},
      props: {},
      on: {},
      style: {}
    }
    const confClone = JSON.parse(JSON.stringify(this.conf))
    const children = []

    const childObjs = componentChild[confClone.tag]
    if (childObjs) {
      // 对于span等原生标签，如果有render方法，直接调用
      if (childObjs.render) {
        children.push(childObjs.render(h, confClone))
      } else {
        Object.keys(childObjs).forEach(key => {
          const childFunc = childObjs[key]
          if (confClone[key]) {
            children.push(childFunc(h, confClone, key))
          }
        })
      }
    }

    Object.keys(confClone).forEach(key => {
      const val = confClone[key]
      if (key === 'vModel') {
        vModel(this, dataObject, confClone.defaultValue)
      } else if (dataObject[key]) {
        dataObject[key] = val
      } else if (!isAttr(key)) {
        // 对于el-upload，先不要覆盖on-*事件处理器，后面会统一设置
        if (!(confClone.tag === 'el-upload' && (key === 'on-success' || key === 'on-change' || key === 'on-remove'))) {
          dataObject.props[key] = val
        }
      } else {
        dataObject.attrs[key] = val
      }
    })

    // 对于el-upload组件，添加上传事件处理和文件列表回显（放在最后确保不被覆盖）
    if (confClone.tag === 'el-upload') {
      handleUpload(this, dataObject, confClone)
      // 使用内部状态维护file-list
      dataObject.props['file-list'] = this.innerFileList
    }
    return h(this.conf.tag, dataObject, children)
  },
  props: ['conf']
}
